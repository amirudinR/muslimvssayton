'use client'

/* Panel tower terpilih: upgrade, jual, ikuti, tutup. */

import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, TrendingUp, Coins, Video } from 'lucide-react'
import { CHAR_DEFS } from '@/lib/game/data'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'

export function TowerPanel() {
  const selectedTower = useGameStore((s) => s.selectedTower)
  const pahala = useGameStore((s) => s.pahala)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)

  if (!selectedTower || screen !== 'playing' || paused) return null
  const def = CHAR_DEFS[selectedTower.char]
  const stats = def.levels[selectedTower.level - 1]
  const nextStats = selectedTower.level < 3 ? def.levels[selectedTower.level] : null
  const affordable = pahala >= selectedTower.upgradeCost

  return (
    <AnimatePresence>
      <motion.div
        key={selectedTower.slot}
        initial={{ opacity: 0, x: 40, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        className="panel-cute pointer-events-auto fixed right-2 top-1/3 z-30 w-56 -translate-y-1/2 px-4 py-3 sm:right-3 sm:w-64"
      >
        <button className="btn-round absolute -right-2 -top-2" aria-label="Tutup" onClick={() => getEngine()?.deselectTower()}>
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-3xl">{def.emoji}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#4a3b20]">{def.name}</p>
            <div className="mt-0.5 flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i <= selectedTower.level ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 space-y-1 rounded-xl bg-amber-50/80 px-3 py-2 text-xs font-bold text-[#6a4d1a]">
          <div className="flex justify-between">
            <span>⚔️ Kekuatan</span>
            <span>
              {stats.damage}
              {nextStats && <span className="text-emerald-600"> → {nextStats.damage}</span>}
            </span>
          </div>
          <div className="flex justify-between">
            <span>🎯 Jangkauan</span>
            <span>
              {stats.range > 50 ? '🎂 Semua' : stats.range}
              {nextStats && nextStats.range <= 50 && <span className="text-emerald-600"> → {nextStats.range}</span>}
            </span>
          </div>
          <div className="flex justify-between">
            <span>⏱️ Ritme</span>
            <span>
              {stats.fireRate.toFixed(1)}s
              {nextStats && <span className="text-emerald-600"> → {nextStats.fireRate.toFixed(1)}s</span>}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-1.5">
          {selectedTower.canUpgrade ? (
            <button
              className={`btn-cute w-full ${affordable ? '' : 'opacity-60'}`}
              onClick={() => getEngine()?.upgradeTower()}
            >
              <TrendingUp className="h-4 w-4" />
              Upgrade · <Star className="h-3.5 w-3.5 fill-current" /> {selectedTower.upgradeCost}
            </button>
          ) : (
            <p className="w-full rounded-2xl bg-amber-100 py-2 text-center text-xs font-black text-amber-600">
              ⭐ Level maksimal! Hebat!
            </p>
          )}
          <button
            className={`btn-cute-secondary w-full ${cameraMode === 'follow' ? 'ring-4 ring-amber-300' : ''}`}
            onClick={() => {
              if (cameraMode === 'follow') getEngine()?.setCameraMode('iso')
              else getEngine()?.followSelected()
              audio.chime()
            }}
          >
            <Video className="h-4 w-4" />
            {cameraMode === 'follow' ? 'Berhenti Ikuti' : 'Ikuti Karakter'}
          </button>
          <button className="btn-cute-danger w-full" onClick={() => getEngine()?.sellTower()}>
            <Coins className="h-4 w-4" />
            Jual · +{selectedTower.sellValue}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
