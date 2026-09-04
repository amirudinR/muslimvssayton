'use client'

/* Tombol kekuatan spesial "DOA BERSAMA" — terisi energi tiap setan
   dihalau; saat penuh berkilau & bisa ditekan untuk berkah besar. */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { DUA_CONST } from '@/lib/game/data'
import { audio } from '@/lib/game/audio'

export function DuaButton() {
  const screen = useGameStore((s) => s.screen)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const duaCharge = useGameStore((s) => s.duaCharge)
  const duaReady = useGameStore((s) => s.duaReady)
  const duaActive = useGameStore((s) => s.duaActive)
  const paused = useGameStore((s) => s.paused)

  if (screen !== 'playing' || cameraMode === 'photo') return null

  const pct = Math.min(100, (duaCharge / DUA_CONST.max) * 100)

  return (
    <div className="pointer-events-none fixed left-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 sm:left-3.5">
      <AnimatePresence>
        {duaActive > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="rounded-full border-2 border-amber-300 bg-[#fff6da]/95 px-3 py-1 text-xs font-black text-amber-700 shadow-md"
          >
            ✨ Berkah doa: {Math.ceil(duaActive)}s
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        {/* meter energi doa */}
        <div className="relative h-24 w-6 overflow-hidden rounded-full border-[3px] border-amber-300 bg-[#fffdf5] shadow-md">
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-amber-400 via-amber-300 to-yellow-200"
            animate={{ height: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
          <div className="absolute inset-x-0 top-1 flex justify-center">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </div>
        </div>

        {/* tombol besar */}
        <button
          className={`btn-dua ${duaReady ? 'btn-dua-ready' : ''}`}
          disabled={!duaReady || paused}
          aria-label="Doa Bersama"
          onClick={() => {
            if (!duaReady) return
            audio.chime()
            getEngine()?.activateDua()
          }}
        >
          {duaReady && <span className="dua-active-badge" aria-hidden />}
          <span className="text-2xl leading-none">🤲</span>
          <span className="text-center leading-tight">
            DOA
            <br />
            BERSAMA
          </span>
        </button>
      </div>
    </div>
  )
}

/* ---------------- toast lencana baru ---------------- */

export function BadgeToastLayer() {
  const badgeToast = useGameStore((s) => s.badgeToast)

  useEffect(() => {
    if (!badgeToast) return
    const t = setTimeout(() => useGameStore.getState().clearBadgeToast(), 3600)
    return () => clearTimeout(t)
  }, [badgeToast])

  if (!badgeToast) return null

  return (
    <AnimatePresence>
      <motion.div
        key={badgeToast.id}
        initial={{ opacity: 0, y: -40, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className="pointer-events-none fixed left-1/2 top-16 z-50 w-[min(92vw,26rem)] -translate-x-1/2"
        role="status"
      >
        <div className="flex items-center gap-3 rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#fff8dd] to-[#ffdd96] px-4 py-3 shadow-xl">
          <span className="animate-bounce-soft text-4xl">{badgeToast.emoji}</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
              Lencana Baru!
            </span>
            <span className="text-base font-black text-[#6a4d1a]">{badgeToast.name}</span>
            <span className="text-xs font-bold text-[#8a6a30]">{badgeToast.desc}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
