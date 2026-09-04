'use client'

/* Bar karakter bawah: kartu besar ramah anak, drag & drop ke slot. */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Lock, X } from 'lucide-react'
import { CHAR_DEFS, CHAR_ORDER, type CharId } from '@/lib/game/data'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { CharPreview } from './CharPreview'

const ACCENT: Record<CharId, string> = {
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

  const onCardDown = (charId: CharId) => (e: React.PointerEvent) => {
    e.preventDefault()
    const engine = getEngine()
    if (!engine) return
    if (!unlocked.includes(charId)) {
      const def = CHAR_DEFS[charId]
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

  const selectedDef = selectedCharId ? CHAR_DEFS[selectedCharId] : null

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
              <CharPreview charId={selectedDef.id} size={92} />
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
