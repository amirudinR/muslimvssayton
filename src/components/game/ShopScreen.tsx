'use client'

/* P4: TOKO KARAKTER — grid kartu, preview 3D berputar, rarity badge,
   harga bintang, filter & sorting (power/rarity/harga), beli & pasang.
   P6: tab BUAT KARAKTER (character creator sederhana). */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Star, Search, SlidersHorizontal, Wand2, Check, Lock, Sparkles } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { getOwnedChars, buyChar, getStarCurrency, addStarCurrency, grantRunReward } from '@/lib/game/achievements'
import {
  ROSTER, RARITY_INFO, POWERS, type RosterChar, type PowerCategory, type Rarity,
  DEFAULT_CUSTOM, ROBE_COLORS, ACCENT_COLORS, SKIN_COLORS, HAIR_COLORS,
  ACCESSORY_INFO, EXPRESSION_INFO, type CharCustom,
} from '@/lib/game/roster'
import { RosterPreview, CustomPreview } from './RosterPreview'

type ShopTab = 'beli' | 'buat'
type SortMode = 'rarity' | 'harga-asc' | 'harga-desc' | 'nama'

const RARITY_ORDER: Record<Rarity, number> = { legendaris: 0, epik: 1, langka: 2, umum: 3 }

export function ShopScreen() {
  const screen = useGameStore((s) => s.screen)
  const [tab, setTab] = useState<ShopTab>('beli')
  const [filterPower, setFilterPower] = useState<PowerCategory | 'semua'>('semua')
  const [filterRarity, setFilterRarity] = useState<Rarity | 'semua'>('semua')
  const [sortMode, setSortMode] = useState<SortMode>('rarity')
  const [query, setQuery] = useState('')
  const [owned, setOwned] = useState<string[]>(() => ['hero-ali', 'hero-aisyah', ...getOwnedChars()])
  const [currency, setCurrency] = useState(() => getStarCurrency())
  const [selected, setSelected] = useState<RosterChar | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: 'good' | 'bad' } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  /* ---- filter & sort (hook dipanggil sebelum early-return!) ---- */
  const filtered = useMemo(() => {
    let list = ROSTER.slice()
    if (filterPower !== 'semua') list = list.filter((c) => c.power === filterPower)
    if (filterRarity !== 'semua') list = list.filter((c) => c.rarity === filterRarity)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.themeLabel.toLowerCase().includes(q))
    }
    switch (sortMode) {
      case 'rarity': list.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.price - b.price); break
      case 'harga-asc': list.sort((a, b) => a.price - b.price); break
      case 'harga-desc': list.sort((a, b) => b.price - a.price); break
      case 'nama': list.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    return list
  }, [filterPower, filterRarity, sortMode, query])

  if (screen !== 'shop') return null

  const refreshState = () => {
    setOwned(['hero-ali', 'hero-aisyah', ...getOwnedChars()])
    setCurrency(getStarCurrency())
  }

  const showToastLocal = (text: string, tone: 'good' | 'bad') => {
    setToastMsg({ text, tone })
    setTimeout(() => setToastMsg(null), 2600)
  }

  const buyNow = (c: RosterChar) => {
    if (owned.includes(c.id)) {
      showToastLocal('Karakter ini sudah jadi milikmu! ✅', 'good')
      return
    }
    if (currency < c.price) {
      showToastLocal(`Bintang kurang! Butuh ${c.price - currency} ⭐ lagi. Menang yuk!`, 'bad')
      audio.mosqueHit()
      return
    }
    const ok = buyChar(c.id, c.price)
    if (ok) {
      audio.tada()
      refreshState()
      showToastLocal(`Yeay! ${c.name} bergabung! 🎉`, 'good')
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#fff8e0] via-[#f6edc8] to-[#e8d9a8]">
      {/* ---------- header ---------- */}
      <div className="flex shrink-0 items-center gap-2 border-b-4 border-amber-300 bg-gradient-to-r from-[#fffbe8] to-[#fff3d0] px-3 py-2 shadow-md sm:px-5 sm:py-3">
        <button
          className="btn-round"
          aria-label="Tutup toko"
          onClick={() => {
            audio.chime()
            useGameStore.getState().setScreen('menu')
          }}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingBag className="h-6 w-6 shrink-0 text-orange-500 sm:h-7 sm:w-7" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-wide text-[#4a3b20] sm:text-xl">TOKO ANAK SHOLEH</h2>
            <p className="-mt-1 hidden text-[10px] font-bold text-[#8a6a30] sm:block">Kumpulkan 100 penjaga masjid!</p>
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

      {/* ---------- tab beli / buat ---------- */}
      <div className="flex shrink-0 justify-center gap-2 px-3 py-2">
        <button className={`shop-tab ${tab === 'beli' ? 'shop-tab-active' : ''}`} onClick={() => setTab('beli')}>
          🛒 Beli Karakter
          <span className="ml-1 rounded-full bg-white/60 px-1.5 text-[10px] font-black">{ROSTER.length}</span>
        </button>
        <button className={`shop-tab ${tab === 'buat' ? 'shop-tab-active' : ''}`} onClick={() => setTab('buat')}>
          <Wand2 className="h-4 w-4" />
          Buat Sendiri!
        </button>
      </div>

      {tab === 'beli' ? (
        <>
          {/* ---------- filter bar ---------- */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 pb-2 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border-2 border-amber-200 bg-white/90 px-3 py-1.5">
              <Search className="h-4 w-4 shrink-0 text-amber-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama penjaga…"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#4a3b20] outline-none placeholder:text-[#c4a86a]"
                aria-label="Cari karakter"
              />
            </div>
            <button className="btn-icon !h-9 !w-9" aria-label="Filter" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="shrink-0 overflow-hidden px-3 sm:px-5"
              >
                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-amber-200 bg-white/80 px-3 py-2">
                  {/* filter power */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6a30]">Kekuatan:</span>
                  <button className={`chip-filter ${filterPower === 'semua' ? 'chip-filter-on' : ''}`} onClick={() => setFilterPower('semua')}>Semua</button>
                  {POWERS.map((p) => (
                    <button key={p.id} className={`chip-filter ${filterPower === p.id ? 'chip-filter-on' : ''}`} onClick={() => setFilterPower(p.id)}>
                      {p.emoji} {p.label}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px bg-amber-200" />
                  {/* filter rarity */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6a30]">Rarity:</span>
                  <button className={`chip-filter ${filterRarity === 'semua' ? 'chip-filter-on' : ''}`} onClick={() => setFilterRarity('semua')}>Semua</button>
                  {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => (
                    <button key={r} className={`chip-filter ${filterRarity === r ? 'chip-filter-on' : ''}`} onClick={() => setFilterRarity(r)}>
                      {RARITY_INFO[r].emoji} {RARITY_INFO[r].label}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px bg-amber-200" />
                  {/* sort */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6a30]">Urut:</span>
                  {([['rarity', 'Rarity'], ['harga-asc', 'Murah'], ['harga-desc', 'Mahal'], ['nama', 'A-Z']] as [SortMode, string][]).map(([m, l]) => (
                    <button key={m} className={`chip-filter ${sortMode === m ? 'chip-filter-on' : ''}`} onClick={() => setSortMode(m)}>{l}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- grid kartu ---------- */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-5">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((c, i) => {
                const isOwned = owned.includes(c.id)
                const ri = RARITY_INFO[c.rarity]
                const power = POWERS.find((p) => p.id === c.power)!
                const affordable = currency >= c.price
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: Math.min(0.3, i * 0.018) }}
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      audio.chime()
                      setSelected(c)
                    }}
                    className={`shop-card relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl p-2 ${isOwned ? 'shop-card-owned' : ''}`}
                    style={{
                      border: `3px solid ${ri.border}`,
                      background: isOwned
                        ? `linear-gradient(180deg, #f0fbf2 0%, #dcf5e2 100%)`
                        : `linear-gradient(180deg, #fffdf5 0%, #fff6dd 100%)`,
                      boxShadow: `0 4px 0 ${ri.border}66, 0 10px 20px rgba(120,90,30,0.18)${c.rarity === 'legendaris' ? ', inset 0 0 24px rgba(245,158,11,0.15)' : ''}`,
                    }}
                    aria-label={`${c.name}, ${ri.label}, ${c.price} bintang`}
                  >
                    {/* rarity badge */}
                    <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black" style={{ color: ri.color }}>
                      {ri.emoji} {ri.label}
                    </span>
                    {isOwned && (
                      <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                        <Check className="h-2.5 w-2.5" /> Milikmu
                      </span>
                    )}
                    {/* preview */}
                    <div className="mt-5 h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                      <RosterPreview rc={c} size={96} />
                    </div>
                    <p className="line-clamp-1 w-full text-center text-xs font-black text-[#4a3b20]">{c.name}</p>
                    <p className="line-clamp-1 w-full text-center text-[9px] font-bold text-[#8a6a30]">
                      {power.emoji} {power.label} · {c.themeLabel}
                    </p>
                    <div className="mt-auto flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
                      {isOwned ? (
                        <span className="flex items-center gap-0.5 text-[11px] font-black text-emerald-600">
                          <Check className="h-3 w-3" /> Sudah punya
                        </span>
                      ) : (
                        <span className={`flex items-center gap-0.5 text-[11px] font-black ${affordable ? 'text-amber-600' : 'text-rose-500'}`}>
                          <Star className={`h-3 w-3 ${affordable ? 'fill-amber-400 text-amber-500' : 'fill-rose-300 text-rose-400'}`} />
                          {c.price}
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-[#8a6a30]">
                <span className="text-5xl">🔍</span>
                <p className="text-sm font-bold">Tidak ada penjaga yang cocok. Coba filter lain ya!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <CharCreator onToast={showToastLocal} />
      )}

      {/* ---------- modal detail & beli ---------- */}
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
              className="panel-cute flex max-w-sm flex-col items-center gap-3 px-6 py-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-36 w-36 rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-sky-100 to-emerald-100 p-1">
                <RosterPreview rc={selected} size={136} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#4a3b20]">{selected.name}</h3>
                <p className="text-xs font-bold text-[#8a6a30]">
                  {selected.themeLabel} · {RARITY_INFO[selected.rarity].emoji} {RARITY_INFO[selected.rarity].label}
                </p>
              </div>
              <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-semibold leading-relaxed text-[#6a4d1a]">
                {selected.desc}
              </p>
              <div className="flex items-center gap-2 rounded-full border-2 border-amber-200 bg-[#fffbe8] px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black text-[#6a4d1a]">
                  {POWERS.find((p) => p.id === selected.power)!.label}: {POWERS.find((p) => p.id === selected.power)!.variants.find((v) => v.id === selected.variant)?.label}
                </span>
              </div>
              {owned.includes(selected.id) ? (
                <div className="flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-black text-emerald-700">
                  <Check className="h-4 w-4" /> Sudah dimiliki!
                </div>
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

      {/* ---------- toast lokal ---------- */}
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

/* ============================================================
 * P6: CHARACTER CREATOR — buat karakter sendiri
 * ============================================================ */

function CharCreator({ onToast }: { onToast: (text: string, tone: 'good' | 'bad') => void }) {
  const [custom, setCustom] = useState<CharCustom>(DEFAULT_CUSTOM)
  const [saved, setSaved] = useState(false)
  const power = POWERS.find((p) => p.id === custom.power)!

  const set = (patch: Partial<CharCustom>) => {
    setCustom((c) => ({ ...c, ...patch }))
    setSaved(false)
  }

  const saveCustom = () => {
    // simpan karakter custom sebagai roster entry milik pemain
    try {
      const KEY = 'penjaga-masjid-custom-char'
      const id = `custom-${Date.now()}`
      const entry = { id, ...custom }
      const list = JSON.parse(window.localStorage.getItem(KEY) || '[]') as unknown[]
      list.push(entry)
      window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)))
      audio.tada()
      setSaved(true)
      onToast(`Karakter "${namaCustom(custom)}" tersimpan! 🎉`, 'good')
    } catch {
      onToast('Gagal menyimpan 😅 coba lagi ya!', 'bad')
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 lg:flex-row">
        {/* ---- preview 3D real-time ---- */}
        <div className="flex shrink-0 flex-col items-center gap-3 lg:w-64">
          <div className="h-48 w-48 rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 p-1 shadow-lg">
            <CustomPreview cc={custom} size={184} />
          </div>
          <p className="text-center text-xs font-bold text-[#6a4d1a]">Putar-putar lihat dari segala arah! 👀</p>
          <div className="w-full rounded-2xl border-2 border-purple-200 bg-purple-50/80 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Kekuatan terpilih</p>
            <p className="text-sm font-black text-[#4a3b20]">
              {power.emoji} {power.label} — {power.variants.find((v) => v.id === custom.variant)?.label}
            </p>
            <p className="mt-1 text-[10px] font-semibold leading-snug text-[#8a6a30]">{power.desc}</p>
            <p className="mt-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold text-purple-500">
              Kekuatan tetap seimbang dari sistem game ⚖️ (fair!)
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className={`btn-cute-lg w-full !py-3 !text-sm ${saved ? 'opacity-70' : ''}`}
            onClick={saveCustom}
          >
            {saved ? <><Check className="h-5 w-5" /> Tersimpan!</> : <><Wand2 className="h-5 w-5" /> SIMPAN KARAKTER!</>}
          </motion.button>
        </div>

        {/* ---- panel kustomisasi ---- */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* presentasi */}
          <CreatorSection title="Bentuk Tubuh" emoji="🧒">
            <div className="flex flex-wrap gap-1.5">
              {(['anak-laki', 'anak-perempuan'] as const).map((p) => (
                <button key={p} className={`chip-filter ${custom.presentation === p ? 'chip-filter-on' : ''}`} onClick={() => set({ presentation: p })}>
                  {p === 'anak-laki' ? '👦 Anak Koko' : '👧 Anak Gamis'}
                </button>
              ))}
            </div>
          </CreatorSection>

          {/* warna baju */}
          <CreatorSection title="Warna Baju Koko/Gamis" emoji="👕">
            <div className="flex flex-wrap gap-1.5">
              {ROBE_COLORS.map((col) => (
                <button
                  key={col}
                  aria-label={`Warna baju ${col.toString(16)}`}
                  className={`swatch ${custom.robeColor === col ? 'swatch-on' : ''}`}
                  style={{ background: '#' + col.toString(16).padStart(6, '0') }}
                  onClick={() => set({ robeColor: col })}
                />
              ))}
            </div>
          </CreatorSection>

          {/* warna peci/hijab */}
          <CreatorSection title="Warna Peci / Hijab" emoji="🧢">
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col}
                  aria-label={`Warna aksen ${col.toString(16)}`}
                  className={`swatch ${custom.accentColor === col ? 'swatch-on' : ''}`}
                  style={{ background: '#' + col.toString(16).padStart(6, '0') }}
                  onClick={() => set({ accentColor: col })}
                />
              ))}
            </div>
          </CreatorSection>

          {/* warna kulit */}
          <CreatorSection title="Warna Kulit" emoji="🖐️">
            <div className="flex flex-wrap gap-1.5">
              {SKIN_COLORS.map((col) => (
                <button
                  key={col}
                  aria-label={`Warna kulit ${col.toString(16)}`}
                  className={`swatch ${custom.skinColor === col ? 'swatch-on' : ''}`}
                  style={{ background: '#' + col.toString(16).padStart(6, '0') }}
                  onClick={() => set({ skinColor: col })}
                />
              ))}
            </div>
          </CreatorSection>

          {/* warna rambut */}
          <CreatorSection title="Warna Rambut" emoji="💇">
            <div className="flex flex-wrap gap-1.5">
              {HAIR_COLORS.map((col) => (
                <button
                  key={col}
                  aria-label={`Warna rambut ${col.toString(16)}`}
                  className={`swatch ${custom.hairColor === col ? 'swatch-on' : ''}`}
                  style={{ background: '#' + col.toString(16).padStart(6, '0') }}
                  onClick={() => set({ hairColor: col })}
                />
              ))}
            </div>
          </CreatorSection>

          {/* aksesoris */}
          <CreatorSection title="Aksesoris" emoji="🎒">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACCESSORY_INFO) as CharCustom['accessory'][]).map((a) => (
                <button key={a} className={`chip-filter ${custom.accessory === a ? 'chip-filter-on' : ''}`} onClick={() => set({ accessory: a })}>
                  {ACCESSORY_INFO[a].emoji} {ACCESSORY_INFO[a].label}
                </button>
              ))}
            </div>
          </CreatorSection>

          {/* ekspresi */}
          <CreatorSection title="Ekspresi Wajah" emoji="😄">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(EXPRESSION_INFO) as CharCustom['expression'][]).map((e) => (
                <button key={e} className={`chip-filter ${custom.expression === e ? 'chip-filter-on' : ''}`} onClick={() => set({ expression: e })}>
                  {EXPRESSION_INFO[e].emoji} {EXPRESSION_INFO[e].label}
                </button>
              ))}
            </div>
          </CreatorSection>

          {/* kekuatan */}
          <CreatorSection title="Pilih Kekuatan (dari sistem game — tetap fair!)" emoji="⚡">
            <div className="flex flex-col gap-1.5">
              {POWERS.map((p) => (
                <button
                  key={p.id}
                  className={`creator-power ${custom.power === p.id ? 'creator-power-on' : ''}`}
                  onClick={() => set({ power: p.id, variant: p.variants[0].id })}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <span className="flex-1 text-left">
                    <span className="block text-xs font-black text-[#4a3b20]">{p.label}</span>
                    <span className="block text-[9px] font-semibold text-[#8a6a30]">{p.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {/* sub-varian */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {power.variants.map((v) => (
                <button key={v.id} className={`chip-filter ${custom.variant === v.id ? 'chip-filter-on' : ''}`} onClick={() => set({ variant: v.id })} title={v.desc}>
                  ⚙️ {v.label}
                </button>
              ))}
            </div>
          </CreatorSection>
        </div>
      </div>
    </div>
  )
}

function CreatorSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white/85 px-3.5 py-2.5 shadow-sm">
      <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-[#8a6a30]">
        {emoji} {title}
      </p>
      {children}
    </div>
  )
}

function namaCustom(c: CharCustom): string {
  const a = 'Anak Sholeh Karya Sendiri'
  return a
}
