'use client'

/* Menu utama: judul besar, tombol MULAI, pilihan kualitas, suara,
   mini-cara-main, dan footer sticky kredit. */

import { motion } from 'framer-motion'
import { Play, Volume2, VolumeX, Music, Music2, Sparkles, Star } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import type { Quality } from '@/lib/game/data'

const HOW_TO = [
  { emoji: '🤲', text: 'Tarik anak sholeh ke lingkaran hijau' },
  { emoji: '👻', text: 'Halau setan jahil yang datang' },
  { emoji: '🕌', text: 'Jaga masjid sampai 10 gelombang!' },
]

const QUALITY_OPTS: { id: Quality; label: string; hint: string }[] = [
  { id: 'low', label: 'Ringan', hint: 'HP/tablet' },
  { id: 'medium', label: 'Sedang', hint: 'Laptop' },
  { id: 'high', label: 'Jempolan', hint: 'Keren full!' },
]

export function MainMenu() {
  const screen = useGameStore((s) => s.screen)
  const quality = useGameStore((s) => s.quality)
  const soundOn = useGameStore((s) => s.soundOn)
  const musicOn = useGameStore((s) => s.musicOn)

  if (screen !== 'menu') return null

  const start = () => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-between overflow-y-auto py-6">
      <div />

      {/* Kartu judul */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
        className="panel-cute pointer-events-auto mx-4 flex max-w-lg flex-col items-center gap-3 px-8 py-7 text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="text-7xl drop-shadow-md"
        >
          🕌
        </motion.div>
        <h1 className="text-3xl font-black leading-tight tracking-wide text-emerald-700 drop-shadow-sm sm:text-4xl">
          PENJAGA MASJID
        </h1>
        <p className="-mt-2 rounded-full bg-amber-100 px-4 py-1 text-sm font-extrabold text-amber-700 sm:text-base">
          Anak Sholeh vs Setan Jahil 👻
        </p>
        <p className="text-xs font-semibold text-[#7a6a4a] sm:text-sm">
          Game 3D seru buat anak sholeh — halau setan jahil dengan cahaya,
          dzikir, sedekah, dan wangi wudhu!
        </p>

        {/* Cara main */}
        <div className="mt-1 flex w-full flex-col gap-1.5">
          {HOW_TO.map((h, i) => (
            <motion.div
              key={h.text}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.18 }}
              className="flex items-center gap-2.5 rounded-2xl bg-emerald-50/80 px-4 py-2 text-left"
            >
              <span className="text-2xl">{h.emoji}</span>
              <span className="text-sm font-bold text-[#3d5a3a]">{h.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.06, rotate: -1 }}
          whileTap={{ scale: 0.94 }}
          className="btn-cute-lg mt-3"
          onClick={start}
        >
          <Play className="h-7 w-7 fill-current" />
          MULAI BERMAIN!
        </motion.button>

        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
          <Star className="h-3.5 w-3.5 fill-current" /> Kumpulkan pahala · upgrade karakter · kalahkan BOSS Banaspati
          <Star className="h-3.5 w-3.5 fill-current" />
        </div>
      </motion.div>

      {/* Kontrol bawah: kualitas & suara */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pointer-events-auto mx-4 mb-4 mt-6 flex w-full max-w-lg flex-col items-center gap-2"
      >
        <div className="panel-cute flex items-center gap-2 px-3 py-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-black text-[#4a3b20]">KUALITAS:</span>
          {QUALITY_OPTS.map((q) => (
            <button
              key={q.id}
              className={`btn-quality ${quality === q.id ? 'btn-quality-active' : ''}`}
              title={q.hint}
              onClick={() => getEngine()?.applyQuality(q.id)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-icon"
            aria-label="Efek suara"
            onClick={() => {
              const st = useGameStore.getState()
              st.setSoundOn(!st.soundOn)
              audio.setSound(!st.soundOn)
              if (!st.soundOn) audio.chime()
            }}
          >
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            className="btn-icon"
            aria-label="Musik"
            onClick={() => {
              const st = useGameStore.getState()
              st.setMusicOn(!st.musicOn)
              audio.setMusic(!st.musicOn)
            }}
          >
            {musicOn ? <Music className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      {/* Footer sticky bawah */}
      <footer className="pointer-events-none inset-x-0 bottom-0 mt-auto w-full bg-gradient-to-t from-emerald-900/40 to-transparent py-2 text-center">
        <p className="text-[11px] font-bold text-white/85 drop-shadow sm:text-xs">
          🌟 Dibuat dengan cinta untuk anak-anak sholeh — bermainlah dengan bijak, jangan lupa sholat ya! 🌟
        </p>
      </footer>
    </div>
  )
}
