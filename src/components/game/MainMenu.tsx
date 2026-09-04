'use client'

/* Menu utama: judul besar, tombol MULAI, pilihan kualitas, suara,
   rekor tersimpan, lencana, papan rekor, dan footer sticky kredit. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Volume2, VolumeX, Music, Music2, Sparkles, Star, Trophy, Medal, Users } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { getRecords, BADGES } from '@/lib/game/achievements'
import type { Quality } from '@/lib/game/data'
import {
  BadgesModal,
  LeaderboardModal,
  MenuBadgesButton,
  MenuLeaderboardButton,
} from './MenuModals'

const HOW_TO = [
  { emoji: '🤲', text: 'Tarik anak sholeh ke lingkaran hijau' },
  { emoji: '👻', text: 'Halau setan jahil yang datang' },
  { emoji: '✨', text: 'Tekan DOA BERSAMA saat penuh!' },
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
  const [showBadges, setShowBadges] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  // rekor dibaca saat menu aktif (localStorage — hanya client)
  const [records] = useState(() => (typeof window !== 'undefined' ? getRecords() : null))

  if (screen !== 'menu') return null

  const start = () => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col">
      {/* hiasan melayang lucu di belakang panel */}
      <motion.span
        aria-hidden
        animate={{ y: [0, -14, 0], rotate: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-[6%] top-[16%] text-5xl opacity-70 drop-shadow-lg"
      >
        🌟
      </motion.span>
      <motion.span
        aria-hidden
        animate={{ y: [0, 12, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[7%] top-[24%] text-5xl opacity-70 drop-shadow-lg"
      >
        🎈
      </motion.span>
      <motion.span
        aria-hidden
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[12%] bottom-[30%] text-4xl opacity-60 drop-shadow-lg"
      >
        🦋
      </motion.span>

      {/* Area utama — bisa scroll di layar pendek */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-4">
        {/* Kartu judul */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
          className="panel-cute pointer-events-auto mx-4 flex max-w-lg flex-col items-center gap-2.5 px-6 py-5 text-center sm:px-8 sm:py-6"
        >
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="text-6xl drop-shadow-md sm:text-7xl"
        >
          🕌
        </motion.div>
        <h1 className="text-3xl font-black leading-tight tracking-wide text-emerald-700 drop-shadow-sm sm:text-4xl">
          PENJAGA MASJID
        </h1>
        <p className="-mt-2 rounded-full bg-amber-100 px-4 py-1 text-sm font-extrabold text-amber-700 shadow-inner sm:text-base">
          Anak Sholeh vs Setan Jahil 👻
        </p>
        <p className="rounded-xl bg-[#fff3d6]/90 px-3 py-1.5 text-xs font-bold text-[#5a4520] [text-shadow:0_1px_0_rgba(255,255,255,0.7)] sm:text-sm">
          Game 3D seru buat anak sholeh — halau setan jahil dengan cahaya,
          dzikir, sedekah, dan wangi wudhu!
        </p>

        {/* Cara main — 2 kolom agar hemat tinggi */}
        <div className="mt-0.5 grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2">
          {HOW_TO.map((h, i) => (
            <motion.div
              key={h.text}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.18 }}
              className="flex items-center gap-2.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/95 px-3.5 py-1.5 text-left shadow-sm"
            >
              <span className="text-xl sm:text-2xl">{h.emoji}</span>
              <span className="text-xs font-bold text-[#3d5a3a] sm:text-sm">{h.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Rekor tersimpan */}
        {records && records.gamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-[#fffbe8] to-[#fff3c9] px-3 py-1.5 shadow-sm"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Rekor Kamu
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="record-pill !px-2 !py-0.5 text-[11px]">
                {[1, 2, 3].map((i) => (
                  <span key={i} className={i <= records.bestStars ? '' : 'opacity-25 grayscale'}>
                    ⭐
                  </span>
                ))}
                <span className="ml-1">terbaik</span>
              </span>
              <span className="record-pill !px-2 !py-0.5 text-[11px]">
                <Trophy className="h-3 w-3 text-amber-500" /> {records.wins} menang
              </span>
              <span className="record-pill !px-2 !py-0.5 text-[11px]">
                <Users className="h-3 w-3 text-emerald-500" /> {records.gamesPlayed} main
              </span>
              <span className="record-pill !px-2 !py-0.5 text-[11px]">
                <Medal className="h-3 w-3 text-rose-400" /> {records.achievements.length}/{BADGES.length} lencana
              </span>
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.06, rotate: -1 }}
          whileTap={{ scale: 0.94 }}
          className="btn-cute-lg mt-1.5"
          onClick={start}
        >
          <Play className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
          MULAI BERMAIN!
        </motion.button>

        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-600 sm:text-xs">
          <Star className="h-3 w-3 fill-current" /> Kumpulkan pahala · upgrade karakter · kalahkan BOSS
          <Star className="h-3 w-3 fill-current" />
        </div>
      </motion.div>
      </div>

      {/* Kontrol bawah — selalu terlihat (toolbar tetap) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pointer-events-auto mx-auto mb-2 flex w-full max-w-lg shrink-0 flex-col items-center gap-1.5 px-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MenuBadgesButton onClick={() => setShowBadges(true)} />
          <MenuLeaderboardButton onClick={() => setShowBoard(true)} />
        </div>

        <div className="panel-cute flex items-center gap-2 px-3 py-1.5">
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
          <div className="mx-0.5 h-5 w-0.5 rounded bg-amber-200" />
          <button
            className="btn-icon !h-9 !w-9"
            aria-label="Efek suara"
            onClick={() => {
              const st = useGameStore.getState()
              st.setSoundOn(!st.soundOn)
              audio.setSound(!st.soundOn)
              if (!st.soundOn) audio.chime()
            }}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            className="btn-icon !h-9 !w-9"
            aria-label="Musik"
            onClick={() => {
              const st = useGameStore.getState()
              st.setMusicOn(!st.musicOn)
              audio.setMusic(!st.musicOn)
            }}
          >
            {musicOn ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Footer sticky bawah */}
        <footer className="pointer-events-none w-full bg-gradient-to-t from-emerald-900/40 to-transparent py-1 text-center">
          <p className="text-[11px] font-bold text-white/85 drop-shadow sm:text-xs">
            🌟 Dibuat dengan cinta untuk anak-anak sholeh — bermainlah dengan bijak, jangan lupa sholat ya! 🌟
          </p>
        </footer>
      </motion.div>

      {/* Modal lencana & papan rekor */}
      <BadgesModal open={showBadges} onClose={() => setShowBadges(false)} />
      <LeaderboardModal open={showBoard} onClose={() => setShowBoard(false)} />
    </div>
  )
}
