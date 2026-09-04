'use client'

/* P3: LEVEL SELECT — peta petualangan dengan node stage berurutan,
   rating bintang 1-3 per level, jalur bertema taman/kampung islami. */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Star, Play, Lock } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { getLevelProgress } from '@/lib/game/achievements'
import { LEVELS, MAX_STARS, isLevelUnlocked, type LevelDef } from '@/lib/game/levels'
import { levelWaves } from '@/lib/game/levels'
import { ENEMY_DEFS, type EnemyId } from '@/lib/game/data'

export function LevelSelectScreen() {
  const screen = useGameStore((s) => s.screen)
  const [progress] = useState(() => getLevelProgress())
  const [preview, setPreview] = useState<LevelDef | null>(null)

  if (screen !== 'levels') return null

  const startLevel = (level: LevelDef) => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame({ levelId: level.id })
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#eaf9d8] via-[#f4f9d8] to-[#ffe9b8]">
      {/* header */}
      <div className="flex shrink-0 items-center gap-2 border-b-4 border-emerald-300 bg-gradient-to-r from-[#f0fbe0] to-[#fffbe8] px-3 py-2 shadow-md sm:px-5 sm:py-3">
        <button
          className="btn-round"
          aria-label="Kembali ke menu"
          onClick={() => {
            audio.chime()
            useGameStore.getState().setScreen('menu')
          }}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-6 w-6 shrink-0 text-emerald-600 sm:h-7 sm:w-7" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-wide text-[#4a3b20] sm:text-xl">PETA PETUALANGAN</h2>
            <p className="-mt-1 hidden text-[10px] font-bold text-[#8a6a30] sm:block">Jelajahi kampung islami demi masjid!</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-white/90 px-3 py-1.5 shadow-inner">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          <span className="text-sm font-black text-amber-600">
            {progress.totalStars}/{MAX_STARS}
          </span>
        </div>
      </div>

      {/* peta */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="relative mx-auto min-h-full w-full max-w-3xl p-4">
          {/* dekorasi peta */}
          <div className="pointer-events-none absolute inset-0 select-none">
            <span className="absolute left-[6%] top-[8%] text-4xl opacity-40">🌳</span>
            <span className="absolute right-[8%] top-[12%] text-4xl opacity-40">🌴</span>
            <span className="absolute left-[4%] bottom-[10%] text-4xl opacity-40">🏞️</span>
            <span className="absolute right-[5%] bottom-[16%] text-4xl opacity-40">⛲</span>
            <span className="absolute left-[30%] top-[4%] text-3xl opacity-30">☁️</span>
            <span className="absolute right-[28%] bottom-[6%] text-3xl opacity-30">☁️</span>
            <span className="absolute left-[48%] top-[40%] text-4xl opacity-25">🦋</span>
          </div>

          {/* garis jalur SVG */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <polyline
              points={LEVELS.map((l) => `${l.mapX}%,${l.mapY}%`).join(' ')}
              fill="none"
              stroke="#c4a86a"
              strokeWidth="5"
              strokeDasharray="10 8"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>

          {/* node level */}
          {LEVELS.map((lvl, i) => {
            const unlocked = isLevelUnlocked(lvl.id, progress.bestLevelDone)
            const stars = progress.levelStars[lvl.id - 1] ?? 0
            return (
              <motion.button
                key={lvl.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.08 * i, type: 'spring', stiffness: 260, damping: 16 }}
                whileHover={unlocked ? { scale: 1.1, zIndex: 10 } : undefined}
                whileTap={unlocked ? { scale: 0.94 } : undefined}
                onClick={() => {
                  if (!unlocked) {
                    audio.mosqueHit()
                    useGameStore.getState().showToast(`Selesaikan level ${lvl.id - 1} dulu ya! 🔒`, '🔒', 'info')
                    return
                  }
                  audio.chime()
                  setPreview(lvl)
                }}
                className={`level-node absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${
                  unlocked ? 'level-node-unlocked' : 'level-node-locked'
                }`}
                style={{ left: `${lvl.mapX}%`, top: `${lvl.mapY}%` }}
                aria-label={`Level ${lvl.id}: ${lvl.name}${unlocked ? '' : ' (terkunci)'}`}
              >
                {unlocked ? (
                  <span className={`level-node-emoji ${lvl.id === progress.bestLevelDone + 1 ? 'level-node-current' : ''}`}>
                    {lvl.emoji}
                  </span>
                ) : (
                  <span className="level-node-emoji grayscale opacity-60">
                    <Lock className="h-6 w-6 text-stone-500" />
                  </span>
                )}
                <span className="text-[10px] font-black leading-none text-[#4a3b20]">Lv.{lvl.id}</span>
                <span className="flex gap-0.5 text-[8px] leading-none">
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={s <= stars ? '' : 'opacity-25 grayscale'}>⭐</span>
                  ))}
                </span>
              </motion.button>
            )
          })}

          {/* start & finish labels */}
          <span className="absolute bottom-[6%] left-[8%] -rotate-6 rounded-full border-2 border-emerald-300 bg-white/80 px-3 py-1 text-[10px] font-black text-emerald-700 shadow">
            🚩 MULAI
          </span>
          <span className="absolute right-[6%] top-[6%] rotate-3 rounded-full border-2 border-amber-400 bg-white/80 px-3 py-1 text-[10px] font-black text-amber-700 shadow">
            👑 KUBAH EMAS
          </span>
        </div>
      </div>

      {/* modal preview level */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.6, y: 40, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="panel-cute flex max-w-sm flex-col items-center gap-3 px-6 py-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-5xl">{preview.emoji}</span>
              <div>
                <h3 className="text-lg font-black text-[#4a3b20]">Level {preview.id}: {preview.name}</h3>
                <p className="text-xs font-bold text-[#8a6a30]">{preview.waves} gelombang · 🕌 {preview.mosqueHp} HP</p>
              </div>
              <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-semibold leading-relaxed text-[#3d5a3a]">
                {preview.desc}
              </p>
              {/* preview musuh */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {enemyPreview(preview.id).map((e) => (
                  <span key={e.emoji} className="flex items-center gap-0.5 rounded-full bg-white/85 border-2 border-stone-200 px-2 py-0.5 text-xs font-bold text-[#4a3b20]">
                    {e.emoji}×{e.count}
                  </span>
                ))}
              </div>
              {/* bintang sebelumnya */}
              {(progress.levelStars[preview.id - 1] ?? 0) > 0 && (
                <div className="flex items-center gap-1 rounded-full border-2 border-amber-200 bg-[#fffbe8] px-3 py-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6a30]">Rekor:</span>
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={`text-sm ${s <= (progress.levelStars[preview.id - 1] ?? 0) ? '' : 'opacity-25 grayscale'}`}>⭐</span>
                  ))}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="btn-cute-lg !py-2.5 !text-sm"
                onClick={() => startLevel(preview)}
              >
                <Play className="h-5 w-5 fill-current" />
                MULAI LEVEL {preview.id}!
              </motion.button>
              <button className="btn-cute-secondary !py-1.5 !text-xs" onClick={() => setPreview(null)}>
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function enemyPreview(levelId: number): { emoji: string; count: number }[] {
  const waves = levelWaves(levelId)
  const agg = new Map<EnemyId, number>()
  waves.forEach((w) => w.spawns.forEach((g) => agg.set(g.type, (agg.get(g.type) ?? 0) + g.count)))
  return Array.from(agg.entries()).map(([type, count]) => ({ emoji: ENEMY_DEFS[type].emoji, count }))
}
