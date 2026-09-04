'use client'

/* Layar akhir: kemenangan (kembang api + takbir ceria), kekalahan lembut,
   dan menu jeda. Semua ramah anak, tanpa nuansa sedih. */

import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Home, Pause, Volume2, VolumeX, Music, Music2 } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'

export function EndScreens() {
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)
  const stats = useGameStore((s) => s.stats)
  const soundOn = useGameStore((s) => s.soundOn)
  const musicOn = useGameStore((s) => s.musicOn)

  const restart = () => getEngine()?.startGame()
  const toMenu = () => getEngine()?.backToMenu()

  return (
    <>
      {/* ---------------- Kemenangan ---------------- */}
      <AnimatePresence>
        {screen === 'victory' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/25 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.5, y: 60, rotate: -3 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="panel-cute relative flex max-w-md flex-col items-center gap-3 overflow-hidden px-8 py-8 text-center"
            >
              {/* hiasan bintang berputar */}
              <span className="animate-spin-slow absolute -left-4 -top-4 text-5xl opacity-60">✨</span>
              <span className="animate-spin-slow absolute -bottom-3 -right-3 text-5xl opacity-60">🎉</span>

              <span className="animate-bounce-soft text-7xl">🕌</span>
              <h2 className="text-3xl font-black tracking-wide text-emerald-700 sm:text-4xl">
                ALHAMDULILLAH!
              </h2>
              <p className="-mt-1 text-lg font-extrabold text-[#6a4d1a]">
                Masjid aman, setan kabur senang-senang! 🎉
              </p>
              <div className="w-full space-y-1.5 rounded-2xl bg-amber-50/90 px-5 py-3 text-sm font-bold text-[#6a4d1a]">
                <p className="flex justify-between">
                  <span>👻 Setan berhasil dihalau</span>
                  <span className="font-black text-emerald-700">{stats.defeated}</span>
                </p>
                <p className="flex justify-between">
                  <span>🌟 Pahala terkumpul</span>
                  <span className="font-black text-amber-600">{stats.starsEarned}</span>
                </p>
                <p className="flex justify-between">
                  <span>🛡️ Gelombang diselesaikan</span>
                  <span className="font-black text-sky-600">{stats.wavesCleared}/10</span>
                </p>
              </div>
              <p className="text-xs font-semibold text-emerald-700">
                Kembang api masih menyala di atas masjid — lihat dulu boleh! 🎆
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <button className="btn-cute" onClick={restart}>
                  <RotateCcw className="h-5 w-5" />
                  Main Lagi!
                </button>
                <button className="btn-cute-secondary" onClick={toMenu}>
                  <Home className="h-5 w-5" />
                  Menu Utama
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Kekalahan (lembut & positif) ---------------- */}
      <AnimatePresence>
        {screen === 'gameover' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-amber-100/40 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.5, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="panel-cute flex max-w-md flex-col items-center gap-3 px-8 py-8 text-center"
            >
              <span className="animate-bounce-soft text-7xl">🤗</span>
              <h2 className="text-2xl font-black tracking-wide text-amber-700 sm:text-3xl">
                Yuk Coba Lagi!
              </h2>
              <p className="text-base font-bold text-[#6a4d1a]">
                Setan kebanyakan main-main kali ini. Masjid butuh penjaga
                hebat sepertimu! 💪
              </p>
              <div className="rounded-2xl bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800">
                💡 Coba taruh Ali &amp; Aisyah lebih dekat jalur, upgrade mereka,
                dan gunakan Fatimah untuk memperlambat setan yang gesit!
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <button className="btn-cute" onClick={restart}>
                  <RotateCcw className="h-5 w-5" />
                  Coba Lagi!
                </button>
                <button className="btn-cute-secondary" onClick={toMenu}>
                  <Home className="h-5 w-5" />
                  Menu Utama
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Jeda ---------------- */}
      <AnimatePresence>
        {screen === 'playing' && paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/30 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="panel-cute flex w-72 flex-col items-center gap-3 px-6 py-6"
            >
              <span className="text-6xl">⏸️</span>
              <h2 className="text-2xl font-black text-[#4a3b20]">Istirahat Dulu!</h2>

              <div className="flex w-full gap-2">
                <button
                  className={`btn-icon flex-1 ${soundOn ? 'ring-2 ring-emerald-300' : ''}`}
                  aria-label="Efek suara"
                  onClick={() => {
                    const st = useGameStore.getState()
                    st.setSoundOn(!st.soundOn)
                    audio.setSound(!st.soundOn)
                  }}
                >
                  {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
                <button
                  className={`btn-icon flex-1 ${musicOn ? 'ring-2 ring-emerald-300' : ''}`}
                  aria-label="Musik"
                  onClick={() => {
                    const st = useGameStore.getState()
                    st.setMusicOn(!st.musicOn)
                    audio.setMusic(!st.musicOn)
                    if (!st.musicOn) audio.startBgm()
                  }}
                >
                  {musicOn ? <Music className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
                </button>
              </div>

              <button
                className="btn-cute w-full"
                onClick={() => useGameStore.getState().setPaused(false)}
              >
                <Play className="h-5 w-5 fill-current" />
                Lanjut Main!
              </button>
              <button className="btn-cute-secondary w-full" onClick={restart}>
                <RotateCcw className="h-5 w-5" />
                Mulai Ulang
              </button>
              <button className="btn-cute-danger w-full" onClick={toMenu}>
                <Home className="h-5 w-5" />
                Ke Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ------------------------- Kontrol mode foto ------------------------- */

export function PhotoControls() {
  const cameraMode = useGameStore((s) => s.cameraMode)
  const screen = useGameStore((s) => s.screen)

  if (cameraMode !== 'photo' || screen !== 'playing') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-auto fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
    >
      <div className="panel-cute px-4 py-2 text-xs font-bold text-[#6a4d1a]">
        📸 Mode Foto: putar dengan drag, cubit/scroll untuk zoom!
      </div>
      <div className="flex gap-2">
        <button className="btn-cute" onClick={() => getEngine()?.screenshot()}>
          📸 Jepret!
        </button>
        <button className="btn-cute-secondary" onClick={() => getEngine()?.setCameraMode('iso')}>
          <Pause className="h-5 w-5" />
          Selesai
        </button>
      </div>
    </motion.div>
  )
}
