'use client'

/* HUD atas: HP masjid, pahala, wave, speed, kamera, suara, boss bar,
   banner wave, countdown + tombol MULAI, toast, dan modal fun fact. */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Pause, Play, Volume2, VolumeX, Camera, Video, RotateCcw,
  RotateCw, Gauge, Heart, ChevronRight,
} from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { CHAR_DEFS, WAVES, GAME_CONST, ENEMY_DEFS, type EnemyId } from '@/lib/game/data'
import { audio } from '@/lib/game/audio'

/* enemy yang muncul pertama kali per wave (untuk banner "setan baru!") */
const FIRST_APPEARANCE: Partial<Record<EnemyId, number>> = (() => {
  const map: Partial<Record<EnemyId, number>> = {}
  WAVES.forEach((w, i) => w.spawns.forEach((s) => { if (map[s.type] === undefined) map[s.type] = i + 1 }))
  return map
})()

export function Hud() {
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)
  const mosqueHp = useGameStore((s) => s.mosqueHp)
  const mosqueMaxHp = GAME_CONST.mosqueMaxHp
  const pahala = useGameStore((s) => s.pahala)
  const wave = useGameStore((s) => s.wave)
  const waveActive = useGameStore((s) => s.waveActive)
  const nextWaveIn = useGameStore((s) => s.nextWaveIn)
  const speed = useGameStore((s) => s.speed)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const soundOn = useGameStore((s) => s.soundOn)
  const bossHp = useGameStore((s) => s.bossHp)
  const bossMaxHp = useGameStore((s) => s.bossMaxHp)
  const wavePreview = useGameStore((s) => s.wavePreview)

  const [banner, setBanner] = useState<{ text: string; kind: 'normal' | 'boss' | 'newEnemy'; enemyEmoji?: string } | null>(null)
  const prevWave = useRef(0)

  useEffect(() => {
    if (wave === prevWave.current || wave === 0) {
      prevWave.current = wave
      return
    }
    prevWave.current = wave
    const isBoss = WAVES[wave - 1]?.isBoss
    // setan yang baru pertama kali muncul di wave ini?
    const newEnemies = (Object.keys(FIRST_APPEARANCE) as EnemyId[]).filter((t) => FIRST_APPEARANCE[t] === wave)
    const newEnemy = newEnemies[0]
    let bannerData: { text: string; kind: 'normal' | 'boss' | 'newEnemy'; enemyEmoji?: string }
    if (isBoss) {
      bannerData = { text: 'BANASPATI NGAMBEK!', kind: 'boss' }
    } else if (newEnemy) {
      bannerData = { text: `Setan Baru: ${ENEMY_DEFS[newEnemy].name}!`, kind: 'newEnemy', enemyEmoji: ENEMY_DEFS[newEnemy].emoji }
    } else {
      bannerData = { text: `Gelombang ${wave} datang!`, kind: 'normal' }
    }
    // setState lewat callback async agar tidak cascading render
    const t1 = setTimeout(() => setBanner(bannerData), 30)
    const t2 = setTimeout(() => setBanner(null), isBoss || newEnemy ? 3200 : 2650)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [wave])

  if (screen !== 'playing') return null

  const hpPct = Math.max(0, (mosqueHp / mosqueMaxHp) * 100)
  const hpLow = hpPct <= 30

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col items-center gap-1.5 px-2 pt-2 sm:gap-2 sm:pt-3">
      {/* ---------- Bar atas ---------- */}
      <div className="pointer-events-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        {/* HP masjid */}
        <div className="panel-cute flex items-center gap-2 px-3 py-1.5">
          <span className="text-xl sm:text-2xl">🕌</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 sm:text-xs">
              <motion.span
                animate={hpLow ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={hpLow ? { repeat: Infinity, duration: 0.8 } : undefined}
                className="inline-flex"
              >
                <Heart className={`h-3 w-3 ${hpLow ? 'fill-rose-500 text-rose-500' : 'fill-rose-400 text-rose-400'}`} />
              </motion.span>
              KESEHATAN MASJID
            </div>
            <div className={`relative mt-0.5 h-3.5 w-28 overflow-hidden rounded-full bg-stone-200 sm:w-36 ${hpLow ? 'hp-low-pulse' : ''}`}>
              <motion.div
                className={`h-full rounded-full ${
                  hpLow
                    ? 'bg-gradient-to-r from-rose-500 to-orange-400'
                    : 'bg-gradient-to-r from-emerald-400 to-lime-400'
                }`}
                animate={{ width: `${hpPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
              <span className="hp-segments" aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => (
                  <i key={i} />
                ))}
              </span>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#4a3b20] sm:text-sm">{mosqueHp}</span>
        </div>

        {/* Wave badge + titik progres */}
        <div className="panel-cute flex flex-col items-center gap-0.5 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl">🛡️</span>
            <span className="text-sm font-extrabold text-[#4a3b20] sm:text-base">
              Gelombang {wave}/{WAVES.length}
            </span>
          </div>
          <div className="flex items-center gap-1" aria-label="Progres gelombang">
            {WAVES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i < wave ? 'w-2.5 bg-amber-400' : i === wave && waveActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Pahala + kontrol */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="panel-cute flex items-center gap-1 px-3 py-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500 sm:h-6 sm:w-6" />
            <motion.span
              key={pahala}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              className="text-sm font-extrabold text-amber-600 sm:text-lg"
            >
              {pahala}
            </motion.span>
          </div>

          {/* Speed 1x/2x */}
          <button
            className="btn-icon"
            aria-label="Kecepatan"
            onClick={() => {
              useGameStore.getState().setSpeed(speed === 1 ? 2 : 1)
              audio.chime()
            }}
          >
            <Gauge className="h-5 w-5" />
            <span className="text-xs font-extrabold">{speed}x</span>
          </button>

          {/* Suara */}
          <button
            className="btn-icon"
            aria-label="Suara"
            onClick={() => {
              const st = useGameStore.getState()
              st.setSoundOn(!st.soundOn)
              audio.setSound(!st.soundOn)
            }}
          >
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* Pause */}
          <button
            className="btn-icon"
            aria-label="Jeda"
            onClick={() => useGameStore.getState().setPaused(true)}
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ---------- Kamera mode ---------- */}
      <div className="pointer-events-auto flex items-center gap-1.5 self-start rounded-2xl border-2 border-amber-200/70 bg-[#fff8e7]/90 px-2 py-1.5 shadow-md backdrop-blur-sm sm:gap-2 sm:px-3">
        <button
          className={`btn-cam ${cameraMode === 'iso' ? 'btn-cam-active' : ''}`}
          aria-label="Kamera strategi"
          onClick={() => getEngine()?.setCameraMode('iso')}
        >
          <Video className="h-4 w-4" />
          <span className="hidden text-[10px] font-extrabold sm:inline">Strategi</span>
        </button>
        <button
          className={`btn-cam ${cameraMode === 'follow' ? 'btn-cam-active' : ''}`}
          aria-label="Ikuti karakter (pilih karakter dulu)"
          onClick={() => {
            const st = useGameStore.getState()
            if (st.selectedTower) getEngine()?.followSelected()
            else st.showToast('Ketuk salah satu anak sholeh dulu, lalu tekan ini 👀', '🎥', 'info')
          }}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden text-[10px] font-extrabold sm:inline">Ikuti</span>
        </button>
        <button
          className={`btn-cam ${cameraMode === 'photo' ? 'btn-cam-active' : ''}`}
          aria-label="Mode foto"
          onClick={() => getEngine()?.setCameraMode('photo')}
        >
          <Camera className="h-4 w-4" />
          <span className="hidden text-[10px] font-extrabold sm:inline">Foto</span>
        </button>
        <div className="mx-0.5 h-5 w-0.5 rounded bg-amber-200" />
        <button className="btn-cam" aria-label="Putar kamera kiri" onClick={() => getEngine()?.rotateCamera(-1)}>
          <RotateCcw className="h-4 w-4" />
        </button>
        <button className="btn-cam" aria-label="Putar kamera kanan" onClick={() => getEngine()?.rotateCamera(1)}>
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* ---------- Boss HP bar ---------- */}
      <AnimatePresence>
        {bossHp !== null && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="panel-cute pointer-events-none flex w-full max-w-md flex-col gap-1 px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm font-extrabold text-orange-600">
                🔥 BANASPATI NGAMBEK
              </span>
              <span className="text-xs font-bold text-stone-500">{Math.ceil(bossHp)} HP</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-stone-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300"
                animate={{ width: `${Math.max(0, (bossHp / Math.max(1, bossMaxHp)) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Banner wave ---------- */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: banner.kind === 'boss' ? [0, -2, 2, -1, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 1.1, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className={`mt-2 rounded-3xl px-6 py-3 text-center ${
              banner.kind === 'boss'
                ? 'boss-banner'
                : banner.kind === 'newEnemy'
                  ? 'new-enemy-banner'
                  : 'wave-banner'
            }`}
            role="status"
          >
            {banner.kind === 'boss' && (
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">
                🔥 BOSS GELOMBANG 🔥
              </p>
            )}
            <p
              className={`text-xl font-black tracking-wide sm:text-2xl ${
                banner.kind === 'boss' ? 'text-white' : banner.kind === 'newEnemy' ? 'text-[#6a2a8a]' : 'text-[#7a4a10]'
              }`}
            >
              {banner.kind === 'newEnemy' && banner.enemyEmoji && (
                <motion.span
                  className="mr-2 inline-block"
                  animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                >
                  {banner.enemyEmoji}
                </motion.span>
              )}
              {banner.text}
            </p>
            {banner.kind === 'newEnemy' && (
              <p className="text-[11px] font-bold text-[#8a5aa8]">
                Lihat tips setan di pratinjau gelombang ya! 👀
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Countdown / tombol MULAI + preview wave berikutnya ---------- */}
      <AnimatePresence>
        {!waveActive && wave < WAVES.length && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto mt-1 flex flex-col items-center gap-1.5"
          >
            {wavePreview.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border-2 border-white/60 bg-black/25 px-4 py-1 backdrop-blur-sm">
                <span className="text-xs font-bold text-white/90">Berikutnya:</span>
                {wavePreview.map((p, i) => (
                  <span key={i} className="flex items-center gap-0.5 text-sm font-extrabold text-white drop-shadow">
                    {p.emoji}<span className="text-xs">×{p.count}</span>
                  </span>
                ))}
              </div>
            )}
            <button className="btn-cute-lg" onClick={() => getEngine()?.startWaveNow()}>
              <Play className="h-6 w-6 fill-current" />
              MULAI GELOMBANG! ({Math.ceil(nextWaveIn)}s)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------ Toast lucu ------------------------------ */

export function ToastLayer() {
  const toast = useGameStore((s) => s.toast)
  const soundOn = useGameStore((s) => s.soundOn)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => useGameStore.getState().clearToast(), 3400)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    audio.setSound(soundOn)
  }, [soundOn])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-36 z-40 flex justify-center px-4 sm:bottom-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`flex max-w-md items-center gap-2 rounded-2xl border-4 px-4 py-2.5 shadow-xl ${
              toast.tone === 'bad'
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : toast.tone === 'good'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-amber-300 bg-[#fff6da] text-[#6a4d1a]'
            }`}
          >
            {toast.emoji && <span className="text-2xl">{toast.emoji}</span>}
            <p className="text-sm font-bold sm:text-base">{toast.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------- Modal fun fact ---------------------------- */

export function FunFactModal() {
  const funFact = useGameStore((s) => s.funFact)
  const clear = useGameStore((s) => s.clearFunFact)
  const soundOn = useGameStore((s) => s.soundOn)

  useEffect(() => {
    if (funFact && soundOn) audio.tada()
  }, [funFact, soundOn])

  return (
    <AnimatePresence>
      {funFact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/30 p-4 backdrop-blur-sm"
          onClick={clear}
        >
          <motion.div
            initial={{ scale: 0.6, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 20 }}
            className="panel-cute relative flex max-w-sm flex-col items-center gap-3 px-6 py-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="animate-bounce-soft text-6xl">{CHAR_DEFS[funFact.char].emoji}</span>
            <p className="text-lg font-black text-[#4a3b20]">Karakter Baru Terbuka!</p>
            <p className="text-sm font-bold text-emerald-700">{CHAR_DEFS[funFact.char].name}</p>
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-relaxed text-[#3d5a3a]">
              💡 {funFact.text}
            </p>
            <button className="btn-cute" onClick={clear}>
              Siap! ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
