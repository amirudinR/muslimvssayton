'use client'

/* P9-c: Klaster indikator power-up Kotak Sedekah — pill per buff berdurasi
   (damage/rate/pahala dengan hitung mundur) + pill Perisai Masjid.
   Dipasang di sisi kiri bawah, tidak mengganggu tombol Dua Bersama. */

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/game/store'
import type { ActivePowerup } from '@/lib/game/store'

/** kelas aksen CSS per jenis power-up */
const KIND_CLASS: Record<ActivePowerup['kind'], string> = {
  damage: 'powerup-pill-damage',
  rate: 'powerup-pill-rate',
  pahala: 'powerup-pill-pahala',
  shield: 'powerup-pill-shield',
  star: 'powerup-pill-star',
}

const pillMotion = {
  initial: { opacity: 0, x: -26, scale: 0.8 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -26, scale: 0.8 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 22 },
}

export function PowerupBadges() {
  const screen = useGameStore((s) => s.screen)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const activePowerups = useGameStore((s) => s.activePowerups)
  const shieldCharges = useGameStore((s) => s.shieldCharges)

  if (screen !== 'playing' || cameraMode === 'photo') return null
  if (activePowerups.length === 0 && shieldCharges <= 0) return null

  return (
    <div className="pointer-events-none fixed bottom-32 left-3 z-30 flex flex-col gap-1.5">
      <AnimatePresence>
        {shieldCharges > 0 && (
          <motion.div key="powerup-shield" {...pillMotion} className="powerup-pill powerup-pill-shield" role="status">
            <span className="text-sm leading-none">🛡️</span>
            <span>Perisai ×{shieldCharges}</span>
          </motion.div>
        )}
        {activePowerups.map((p) => (
          <motion.div
            key={p.id}
            {...pillMotion}
            className={`powerup-pill ${KIND_CLASS[p.kind] ?? 'powerup-pill-damage'}`}
            role="status"
          >
            <span className="text-sm leading-none">{p.emoji}</span>
            <span>{p.name}</span>
            <span className="powerup-pill-time">⏳ {Math.max(0, Math.ceil(p.remaining))}s</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
