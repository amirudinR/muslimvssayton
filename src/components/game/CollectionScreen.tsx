'use client'

/* ============================================================
 * P8: LAYAR KOLEKSI — album karakter lengkap pemain.
 * Terbuka dari Main Menu (tombol KOLEKSI) & saat bermain
 * (indikator "Koleksi N+" di CharacterBar — game otomatis jeda).
 * Fitur: statistik kepemilikan + progress bar, tab Milikku/Semua,
 * filter power & rarity, pencarian, kartu preview 3D lazy-loading,
 * modal detail (stats nyata + funFact edukatif unik) + BELI ⭐
 * + PASANG langsung saat bermain.
 * ============================================================ */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Search, Check, Lock, Sparkles, BookOpen, Hand, Heart, Zap } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { buyChar } from '@/lib/game/achievements'
import { closeCollection, refreshCollData } from '@/lib/game/collection'
import {
  ROSTER, RARITY_INFO, POWERS,
  type RosterChar, type PowerCategory, type Rarity,
} from '@/lib/game/roster'
import { getCharDef } from '@/lib/game/chardb'
import { RosterPreview, LazyRosterPreview } from './RosterPreview'

type CollTab = 'milik' | 'semua'

const RARITY_ORDER: Record<Rarity, number> = { legendaris: 0, epik: 1, langka: 2, umum: 3 }

/** id gameplay utk memasang (hero-umar → umar). */
function placeIdOf(c: RosterChar): string {
  return c.heroId && c.id.startsWith('hero-') ? c.heroId : c.id
}

export function CollectionScreen() {
  const open = useGameStore((s) => s.collectionOpen)
  const screen = useGameStore((s) => s.screen)
  /* data koleksi dimuat sinkron oleh openCollection() → store (bebas effect) */
  const owned = useGameStore((s) => s.collOwned)
  const currency = useGameStore((s) => s.collCurrency)
  const customs = useGameStore((s) => s.collCustoms)
  /* P9-b: statistik pemakaian (key = id gameplay, lihat placeIdOf) */
  const usage = useGameStore((s) => s.collUsage)

  const [tab, setTab] = useState<CollTab>('milik')
  const [filterPower, setFilterPower] = useState<PowerCategory | 'semua'>('semua')
  const [filterRarity, setFilterRarity] = useState<Rarity | 'semua'>('semua')
  const [query, setQuery] = useState('')
  /* P9-b: pengurutan daftar — rarity (default) / paling dipakai */
  const [sortBy, setSortBy] = useState<'rarity' | 'usage'>('rarity')
  const [selected, setSelected] = useState<RosterChar | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: 'good' | 'bad' } | null>(null)

  const allChars = useMemo(() => [...ROSTER, ...customs], [customs])
  const ownedSet = useMemo(() => {
    const s = new Set(owned)
    customs.forEach((c) => s.add(c.id)) // karya sendiri selalu dimiliki
    return s
  }, [owned, customs])

  /* ---- statistik kepemilikan ---- */
  const stats = useMemo(() => {
    const byRarity: Record<Rarity, number> = { umum: 0, langka: 0, epik: 0, legendaris: 0 }
    let ownedCount = 0
    for (const c of allChars) {
      if (ownedSet.has(c.id)) {
        ownedCount++
        byRarity[c.rarity]++
      }
    }
    return { total: allChars.length, ownedCount, byRarity, pct: allChars.length ? Math.round((ownedCount / allChars.length) * 100) : 0 }
  }, [allChars, ownedSet])

  /* ---- daftar kartu sesuai tab + filter + cari ---- */
  const filtered = useMemo(() => {
    let list = allChars.filter((c) => (tab === 'milik' ? ownedSet.has(c.id) : true))
    if (filterPower !== 'semua') list = list.filter((c) => c.power === filterPower)
    if (filterRarity !== 'semua') list = list.filter((c) => c.rarity === filterRarity)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.themeLabel.toLowerCase().includes(q))
    }
    if (sortBy === 'usage') {
      /* P9-b: "Paling Dipakai" — milik dgn pemakaian terbanyak di atas,
         lalu sisa milik, lalu yang belum dimiliki tetap by rarity. */
      list.sort(
        (a, b) =>
          (ownedSet.has(b.id) ? usage[placeIdOf(b)]?.placed ?? 0 : -1) -
            (ownedSet.has(a.id) ? usage[placeIdOf(a)]?.placed ?? 0 : -1) ||
          RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] ||
          a.name.localeCompare(b.name),
      )
    } else {
      list.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.name.localeCompare(b.name))
    }
    return list
  }, [allChars, ownedSet, tab, filterPower, filterRarity, query, sortBy, usage])

  if (!open) return null

  const close = () => {
    audio.chime()
    setSelected(null) // [FIX] jangan biarkan modal detail terbuka saat koleksi dibuka lagi
    closeCollection()
  }

  const showToastLocal = (text: string, tone: 'good' | 'bad') => {
    setToastMsg({ text, tone })
    setTimeout(() => setToastMsg(null), 2600)
  }

  const buyNow = (c: RosterChar) => {
    if (ownedSet.has(c.id)) return
    if (currency < c.price) {
      showToastLocal(`Bintang kurang! Butuh ${c.price - currency} ⭐ lagi. Menang yuk!`, 'bad')
      audio.mosqueHit()
      return
    }
    const ok = buyChar(c.id, c.price)
    if (ok) {
      audio.buyRarity(c.rarity) // jingle khas rarity!
      refreshCollData()
      showToastLocal(`${c.name} masuk koleksi! 🎉`, 'good')
    }
  }

  /** pilih & langsung mulai penempatan (hanya saat bermain). */
  const pickAndPlace = (c: RosterChar) => {
    const engine = getEngine()
    if (!engine) return
    const pid = placeIdOf(c)
    useGameStore.getState().setSelectedChar(pid)
    useGameStore.getState().setDragging(true)
    engine.beginPlacing(pid)
    setSelected(null) // [FIX] bersihkan modal agar tidak muncul lagi saat koleksi dibuka
    closeCollection()
  }

  const selectedDef = selected ? getCharDef(placeIdOf(selected)) : null
  /* P9-b: statistik pemakaian karakter yang sedang dilihat di modal */
  const selectedUsage = selected ? usage[placeIdOf(selected)] : undefined

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#f2fbf4] via-[#e6f5e9] to-[#d4eccf]">
      {/* ================= header ================= */}
      <div className="flex shrink-0 items-center gap-2 border-b-4 border-emerald-300 bg-gradient-to-r from-[#f0fdf4] to-[#dcf5e2] px-3 py-2 shadow-md sm:px-5 sm:py-3">
        <button className="btn-round" aria-label="Tutup koleksi" onClick={close}>
          <X className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-6 w-6 shrink-0 text-emerald-600 sm:h-7 sm:w-7" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-wide text-[#2f5340] sm:text-xl">KOLEKSI PENJAGAKU</h2>
            <p className="-mt-1 hidden text-[10px] font-bold text-[#4a7a5e] sm:block">Album 100 anak sholeh penjaga masjid 📔</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full border-2 border-amber-300 bg-white/90 px-3 py-1.5 shadow-inner">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500 sm:h-5 sm:w-5" />
            <motion.span key={currency} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-sm font-black text-amber-600 sm:text-base">
              {currency}
            </motion.span>
          </div>
        </div>
      </div>

      {/* ================= statistik kepemilikan ================= */}
      <div className="shrink-0 px-3 py-2.5 sm:px-5">
        <div className="mx-auto max-w-5xl">
          <div className="coll-stat-card flex flex-wrap items-center gap-2 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-rose-400 text-rose-500" />
              <span className="text-sm font-black text-[#2f5340]">
                {stats.ownedCount}
                <span className="text-[#4a7a5e]"> / {stats.total} terkumpul</span>
              </span>
            </div>
            {/* progress bar */}
            <div className="h-4 min-w-[140px] flex-1 overflow-hidden rounded-full border-2 border-emerald-200 bg-white/80">
              <motion.div
                key={stats.ownedCount}
                initial={{ width: 0 }}
                animate={{ width: `${stats.pct}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                className="coll-progress-fill relative h-full"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow">
                  {stats.pct}%
                </span>
              </motion.div>
            </div>
            {/* chip rarity */}
            <div className="flex flex-wrap items-center gap-1">
              {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => (
                <span
                  key={r}
                  className="coll-rarity-chip"
                  style={{ borderColor: RARITY_INFO[r].border, color: RARITY_INFO[r].color }}
                  title={`${RARITY_INFO[r].label}: ${stats.byRarity[r]} dimiliki`}
                >
                  {RARITY_INFO[r].emoji} {stats.byRarity[r]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= tab + cari + filter ================= */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-3 pb-1 sm:px-5">
        <button className={`coll-tab ${tab === 'milik' ? 'coll-tab-active' : ''}`} onClick={() => setTab('milik')}>
          <Heart className="h-3.5 w-3.5" /> Milikku
          <span className="ml-1 rounded-full bg-white/60 px-1.5 text-[10px] font-black">{stats.ownedCount}</span>
        </button>
        <button className={`coll-tab ${tab === 'semua' ? 'coll-tab-active' : ''}`} onClick={() => setTab('semua')}>
          <BookOpen className="h-3.5 w-3.5" /> Semua
          <span className="ml-1 rounded-full bg-white/60 px-1.5 text-[10px] font-black">{stats.total}</span>
        </button>
        <div className="flex min-w-[150px] flex-1 items-center gap-1.5 rounded-full border-2 border-emerald-200 bg-white/90 px-3 py-1.5 sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-emerald-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama penjaga…"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#2f5340] outline-none placeholder:text-[#9fc4ad]"
            aria-label="Cari karakter di koleksi"
          />
        </div>
      </div>

      {/* filter power & rarity */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 pb-2 pt-1 sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#4a7a5e]">Kekuatan:</span>
          <button className={`chip-filter ${filterPower === 'semua' ? 'chip-filter-on' : ''}`} onClick={() => setFilterPower('semua')}>Semua</button>
          {POWERS.map((p) => (
            <button key={p.id} className={`chip-filter ${filterPower === p.id ? 'chip-filter-on' : ''}`} onClick={() => setFilterPower(p.id)}>
              {p.emoji} {p.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-emerald-200" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#4a7a5e]">Rarity:</span>
          <button className={`chip-filter ${filterRarity === 'semua' ? 'chip-filter-on' : ''}`} onClick={() => setFilterRarity('semua')}>Semua</button>
          {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => (
            <button key={r} className={`chip-filter ${filterRarity === r ? 'chip-filter-on' : ''}`} onClick={() => setFilterRarity(r)}>
              {RARITY_INFO[r].emoji} {RARITY_INFO[r].label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-emerald-200" />
          {/* P9-b: pengurutan daftar */}
          <span className="text-[10px] font-black uppercase tracking-wider text-[#4a7a5e]">Urutkan:</span>
          <button className={`coll-sort-chip ${sortBy === 'rarity' ? 'coll-sort-chip-on' : ''}`} onClick={() => setSortBy('rarity')}>
            ⭐ Rarity
          </button>
          <button className={`coll-sort-chip ${sortBy === 'usage' ? 'coll-sort-chip-on' : ''}`} onClick={() => setSortBy('usage')}>
            📊 Paling Dipakai
          </button>
        </div>
      </div>

      {/* ================= grid kartu ================= */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 sm:px-5">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((c, i) => {
            const isOwned = ownedSet.has(c.id)
            const ri = RARITY_INFO[c.rarity]
            const power = POWERS.find((p) => p.id === c.power)!
            const isCustom = c.id.startsWith('custom-')
            /* P9-b: statistik pemakaian karakter ini (dipasang / menang) */
            const u = usage[placeIdOf(c)]
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(0.3, i * 0.015) }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  audio.chime()
                  setSelected(c)
                }}
                className={`coll-card relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl p-2 ${isOwned ? 'coll-card-owned' : 'coll-card-locked'} ${c.rarity === 'legendaris' && isOwned ? 'coll-card-legend' : ''}`}
                style={{ borderColor: ri.border }}
                aria-label={`${c.name}, ${isOwned ? 'dimiliki' : `harga ${c.price} bintang`}`}
              >
                {/* badge rarity */}
                <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black" style={{ color: ri.color }}>
                  {ri.emoji} {ri.label}
                </span>
                {isOwned ? (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                    <Check className="h-2.5 w-2.5" /> Milikmu
                  </span>
                ) : (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-stone-500/90 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                    <Lock className="h-2.5 w-2.5" /> {c.price}⭐
                  </span>
                )}
                {/* preview 3D lazy */}
                <div className="mt-5 h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                  <LazyRosterPreview rc={c} size={92} />
                </div>
                <p className="line-clamp-1 w-full text-center text-xs font-black text-[#2f5340]">{c.name}</p>
                <p className="line-clamp-1 w-full text-center text-[9px] font-bold text-[#4a7a5e]">
                  {isCustom ? '🎨' : power.emoji} {isCustom ? 'Karya Sendiri' : power.label} · {c.themeLabel}
                </p>
                {/* P9-b: badge statistik pemakaian (hanya milik + pernah dipasang) */}
                {isOwned && u && u.placed > 0 && (
                  <span className="coll-usage-badge" title={`Dipasang ${u.placed}× · Menang ${u.wins}×`}>
                    📊 {u.placed}×
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-[#4a7a5e]">
            <span className="text-5xl">📔</span>
            <p className="text-sm font-bold">
              {tab === 'milik' ? 'Belum ada penjaga di sini — belanja di Toko yuk!' : 'Tidak ada yang cocok. Coba filter lain!'}
            </p>
          </div>
        )}
      </div>

      {/* ================= modal detail ================= */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.6, y: 40, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="panel-cute flex max-h-[92vh] w-full max-w-sm flex-col items-center gap-2.5 overflow-y-auto px-6 py-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-36 w-36 shrink-0 rounded-3xl border-2 border-emerald-200 bg-gradient-to-b from-sky-100 to-emerald-100 p-1">
                <RosterPreview rc={selected} size={136} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2f5340]">{selected.name}</h3>
                <p className="text-xs font-bold text-[#4a7a5e]">
                  {selected.themeLabel} · {RARITY_INFO[selected.rarity].emoji} {RARITY_INFO[selected.rarity].label}
                </p>
              </div>

              {/* stats nyata dari sistem game */}
              {selectedDef && (
                <div className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/70 px-3 py-2 text-left text-[11px] font-bold text-[#2f5340]">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#4a7a5e]">
                    <Zap className="h-3 w-3" /> Statistik Level 1
                  </p>
                  {selectedDef.attack === 'sedekah' ? (
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span>💰 Sedekah /tik</span>
                        <span>+{selectedDef.pahalaGen?.[0][0] ?? 5}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💡 Aura nasihat</span>
                        <span>+10% damage tetangga</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⏱️ Interval</span>
                        <span>{selectedDef.pahalaGen?.[0][1] ?? 6}s</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span>⚔️ Kekuatan</span>
                        <span>{selectedDef.levels[0].damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎯 Jangkauan</span>
                        <span>{selectedDef.levels[0].range > 50 ? '🎂 Semua' : selectedDef.levels[0].range}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⏱️ Ritme</span>
                        <span>{selectedDef.levels[0].fireRate.toFixed(1)}s</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-emerald-200/60 pt-0.5 text-[10px] text-[#4a7a5e]">
                    <span>Biaya pasang</span>
                    <span>⭐ {selectedDef.cost} pahala</span>
                  </div>
                </div>
              )}

              {/* P9-b: chip statistik pemakaian (milik + pernah dipasang) */}
              {ownedSet.has(selected.id) && selectedUsage && selectedUsage.placed > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="coll-usage-chip" title={`Karakter ini dipasang ${selectedUsage.placed} kali`}>
                    📊 Dipasang {selectedUsage.placed}×
                  </span>
                  <span className="coll-usage-chip" title={`Ikut menang ${selectedUsage.wins} kali`}>
                    🏆 Menang {selectedUsage.wins}×
                  </span>
                </div>
              )}

              {/* power + varian */}
              <div className="flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-[#f0fdf4] px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black text-[#2f5340]">
                  {POWERS.find((p) => p.id === selected.power)!.label}:{' '}
                  {POWERS.find((p) => p.id === selected.power)!.variants.find((v) => v.id === selected.variant)?.label}
                </span>
              </div>

              {/* funFact edukatif unik */}
              {selectedDef && (
                <div className="flex w-full items-start gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-left">
                  <span className="mt-0.5 shrink-0 text-base">💡</span>
                  <p className="text-[11px] font-semibold leading-relaxed text-[#6a4d1a]">{selectedDef.funFact}</p>
                </div>
              )}

              {/* rarity desc */}
              <p className="text-[10px] font-bold italic text-[#4a7a5e]">{RARITY_INFO[selected.rarity].desc}</p>

              {/* aksi */}
              {ownedSet.has(selected.id) ? (
                screen === 'playing' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    className="btn-cute-lg !py-2.5 !text-sm"
                    onClick={() => {
                      audio.tada()
                      pickAndPlace(selected)
                    }}
                  >
                    <Hand className="h-5 w-5" />
                    PASANG PENJAGA INI!
                  </motion.button>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-black text-emerald-700">
                      <Check className="h-4 w-4" /> Sudah jadi milikmu!
                    </div>
                    <button
                      className="btn-cute-secondary !py-1.5 !text-xs"
                      onClick={() => {
                        audio.chime()
                        close()
                        useGameStore.getState().setScreen('levels')
                      }}
                      title="Pilih level dan bermain dengan koleksimu"
                    >
                      <Sparkles className="h-4 w-4" /> Mainkan Koleksimu!
                    </button>
                  </div>
                )
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className={`btn-cute-lg !py-2.5 !text-sm ${currency < selected.price ? 'opacity-60' : ''}`}
                  onClick={() => buyNow(selected)}
                >
                  <Star className="h-5 w-5 fill-current" />
                  BELI {selected.price} BINTANG
                </motion.button>
              )}
              <button className="btn-cute-secondary !py-1.5 !text-xs" onClick={() => setSelected(null)}>
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= toast ================= */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border-4 px-5 py-2.5 text-sm font-bold shadow-xl ${
              toastMsg.tone === 'good' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-700'
            }`}
          >
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
