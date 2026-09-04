'use client'

/* Bar karakter bawah: kartu besar ramah anak, drag & drop ke slot.
   P7: hero (6) + karakter milik pemain dari TOKO (roster generatif)
   + karakter custom buatan sendiri — semua bisa dipasang! */

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Lock, X, Sparkles } from 'lucide-react'
import { CHAR_DEFS, CHAR_ORDER } from '@/lib/game/data'
import { getCharDef } from '@/lib/game/chardb'
import { getRosterChar, RARITY_INFO } from '@/lib/game/roster'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { CharPreview } from './CharPreview'
import { RosterPreview } from './RosterPreview'

const ACCENT: Record<string, string> = {
  ali: '#2ea36a',
  aisyah: '#e86a92',
  umar: '#f5b83d',
  fatimah: '#5bc8c0',
  misbah: '#6db3d9',
  kakek: '#8f9779',
}

export function CharacterBar() {
  const pahala = useGameStore((s) => s.pahala)
  const wave = useGameStore((s) => s.wave)
  const selectedCharId = useGameStore((s) => s.selectedCharId)
  const dragging = useGameStore((s) => s.dragging)
  const unlocked = useGameStore((s) => s.unlockedChars)
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)

  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)

  /* kartu roster milik pemain (di luar 6 hero) — dibaca sekali saat mount layar playing */
  const ownedExtra = useMemo(() => {
    return unlocked.filter((id) => !CHAR_ORDER.includes(id as never))
  }, [unlocked])

  useEffect(() => {
    const move = (e: PointerEvent) => setGhost({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useEffect(() => {
    const up = () => useGameStore.getState().setDragging(false)
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  if (screen !== 'playing' || paused) return null

  const onCardDown = (charId: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    const engine = getEngine()
    if (!engine) return
    if (!unlocked.includes(charId)) {
      const def = getCharDef(charId)
      useGameStore.getState().showToast(`Terbuka di gelombang ${def.unlockWave}! Semangat ya 🔒`, '🔒', 'info')
      return
    }
    if (selectedCharId === charId) {
      engine.cancelPlacing()
      return
    }
    useGameStore.getState().setSelectedChar(charId)
    useGameStore.getState().setDragging(true)
    engine.beginPlacing(charId)
  }

  const selectedDef = selectedCharId ? getCharDef(selectedCharId) : null
  const selectedRoster = selectedCharId ? getRosterChar(selectedCharId) : null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-2 pb-2 safe-bottom sm:pb-3">
      {/* Panel preview karakter terpilih */}
      <AnimatePresence>
        {selectedDef && (
          <motion.div
            key={selectedDef.id}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="panel-cute pointer-events-auto relative flex max-w-[92vw] items-center gap-3 px-4 py-2.5"
          >
            <div className="shrink-0 rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-100 p-1">
              {selectedRoster ? (
                <RosterPreview rc={selectedRoster} size={92} />
              ) : (
                <CharPreview charId={selectedDef.id as 'ali'} size={92} />
              )}
            </div>
            <div className="min-w-0 max-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedDef.emoji}</span>
                <p className="truncate text-sm font-bold text-[#4a3b20] sm:text-base">{selectedDef.name}</p>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">{selectedDef.role}</p>
              <p className="mt-1 hidden text-xs leading-snug text-[#7a6a4a] sm:block">{selectedDef.desc}</p>
              <div className="mt-1.5 flex items-center gap-1 text-sm font-bold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                {selectedDef.cost}
              </div>
            </div>
            <button
              className="btn-round absolute -right-2 -top-2"
              aria-label="Batal"
              onClick={() => getEngine()?.cancelPlacing()}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kartu-kartu karakter */}
      <div data-tut="cards" className="pointer-events-auto flex max-w-full items-stretch gap-1.5 overflow-x-auto pb-1 sm:gap-2.5">
        {/* --- 6 hero --- */}
        {CHAR_ORDER.map((id) => {
          const def = CHAR_DEFS[id]
          const isUnlocked = unlocked.includes(id)
          const affordable = pahala >= def.cost
          const selected = selectedCharId === id
          return (
            <motion.button
              key={id}
              whileHover={isUnlocked ? { y: -6, rotate: -1.5 } : undefined}
              whileTap={isUnlocked ? { scale: 0.92 } : undefined}
              onPointerDown={onCardDown(id)}
              className={`card-char relative flex w-[72px] shrink-0 select-none flex-col items-center gap-0.5 rounded-2xl border-2 px-1.5 py-2 sm:w-[86px] sm:py-2.5 ${
                selected
                  ? 'border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.45)]'
                  : isUnlocked && affordable
                    ? 'border-amber-200 bg-[#fffaf0] hover:border-amber-400'
                    : 'border-stone-200 bg-stone-100 opacity-80'
              }`}
              style={{ touchAction: 'none' }}
              aria-label={`Pilih ${def.name}`}
            >
              <span className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 rounded-full" style={{ background: ACCENT[id] }} />
              {def.attack === 'sedekah' && (
                <span
                  className="pointer-events-none absolute right-1 top-1 rounded-full bg-amber-100 px-1 text-[9px] font-black text-amber-700 shadow-sm"
                  title="Menghasilkan pahala"
                >
                  💰
                </span>
              )}
              <span className={`text-3xl sm:text-4xl ${isUnlocked ? '' : 'grayscale'}`}>{def.emoji}</span>
              <span className="pointer-events-none truncate text-[11px] font-bold text-[#4a3b20] sm:text-xs">{def.shortName}</span>
              {isUnlocked ? (
                <span className={`pointer-events-none flex items-center gap-0.5 text-[11px] font-extrabold sm:text-xs ${affordable ? 'text-amber-600' : 'text-rose-500'}`}>
                  <Star className="h-3 w-3 fill-current" />
                  {def.cost}
                </span>
              ) : (
                <span className="pointer-events-none flex items-center gap-0.5 text-[10px] font-bold text-stone-500">
                  <Lock className="h-3 w-3" />
                  {def.unlockWave > wave ? `W${def.unlockWave}` : 'Baru!'}
                </span>
              )}
            </motion.button>
          )
        })}

        {/* --- P7: karakter milik pemain (roster & custom) --- */}
        {ownedExtra.map((id) => {
          const def = getCharDef(id)
          const rc = getRosterChar(id)
          const affordable = pahala >= def.cost
          const selected = selectedCharId === id
          const ri = rc ? RARITY_INFO[rc.rarity] : RARITY_INFO.umum
          return (
            <motion.button
              key={id}
              whileHover={{ y: -6, rotate: -1.5 }}
              whileTap={{ scale: 0.92 }}
              onPointerDown={onCardDown(id)}
              className={`card-char relative flex w-[72px] shrink-0 select-none flex-col items-center gap-0.5 rounded-2xl border-2 px-1.5 py-2 sm:w-[86px] sm:py-2.5 ${
                selected
                  ? 'border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.45)]'
                  : affordable
                    ? 'bg-[#fffaf0]'
                    : 'border-stone-200 bg-stone-100 opacity-80'
              }`}
              style={{ touchAction: 'none', borderColor: selected ? undefined : ri.border }}
              aria-label={`Pilih ${def.name}`}
            >
              {/* badge rarity */}
              <span
                className="pointer-events-none absolute left-1 top-1 rounded-full bg-white/90 px-1 text-[8px] font-black"
                style={{ color: ri.color }}
                title={ri.label}
              >
                {ri.emoji}
              </span>
              {rc?.power === 'nasihat' && (
                <span
                  className="pointer-events-none absolute right-1 top-1 rounded-full bg-amber-100 px-1 text-[9px] font-black text-amber-700 shadow-sm"
                  title="Menghasilkan pahala"
                >
                  💰
                </span>
              )}
              <div className="h-10 w-full overflow-hidden">
                <RosterPreview rc={rc!} size={72} />
              </div>
              <span className="pointer-events-none truncate text-[11px] font-bold text-[#4a3b20] sm:text-xs">{def.shortName}</span>
              <span className={`pointer-events-none flex items-center gap-0.5 text-[11px] font-extrabold sm:text-xs ${affordable ? 'text-amber-600' : 'text-rose-500'}`}>
                <Star className="h-3 w-3 fill-current" />
                {def.cost}
              </span>
            </motion.button>
          )
        })}

        {/* --- indikator koleksi (bila pemain punya banyak) --- */}
        {ownedExtra.length > 0 && (
          <div className="pointer-events-none flex w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-1 py-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-center text-[9px] font-black leading-tight text-amber-700">
              Koleksi
              <br />
              {ownedExtra.length}+{unlocked.length > 8 ? '' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Hint kecil ramah anak */}
      <p className="pointer-events-none hidden text-center text-xs font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] sm:block">
        Tarik kartu ke lingkaran hijau 🟢 lalu lepas — atau ketuk kartu, ketuk lingkaran!
      </p>

      {/* Ghost drag mengikuti kursor */}
      {dragging && selectedDef && ghost && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-lg"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {selectedDef.emoji}
          <div className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 animate-ping rounded-full bg-amber-300" />
        </div>
      )}
    </div>
  )
}
