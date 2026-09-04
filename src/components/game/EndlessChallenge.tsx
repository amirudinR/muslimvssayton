'use client'

/* P11: Kartu Mode Tak Berujung untuk menu utama — bertahan selama mungkin
   melawan gelombang yang terus digenerasi (setiap wave ke-5 boss!).
   Rekor gelombang terjauh tersimpan; skor masuk papan rekor. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Infinity as InfinityIcon, Trophy } from 'lucide-react'
import { getBestEndlessWave } from '@/lib/game/achievements'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'

export function EndlessChallengeCard() {
  const [best] = useState(() => getBestEndlessWave())

  const startEndless = () => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame({ endless: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.65 }}
      className="endless-card pointer-events-auto mx-4 flex w-full max-w-lg flex-col gap-2 px-4 py-3 sm:px-5"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-teal-700 sm:text-sm">
          <InfinityIcon className="h-4 w-4 text-teal-600" />
          Mode Tak Berujung
        </span>
        <span className="endless-best-chip">
          <Trophy className="h-3 w-3" />
          {best > 0 ? `Rekor: Gel. ${best}` : 'Belum ada rekor'}
        </span>
      </div>

      {/* deskripsi */}
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
          className="text-4xl drop-shadow sm:text-5xl"
          aria-hidden
        >
          ♾️
        </motion.span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-black text-[#0f766e] sm:text-lg">Bertahan Selama Mungkin!</p>
          <p className="text-[11px] font-bold leading-snug text-[#0d9488] sm:text-xs">
            Gelombang tak pernah berhenti datang — setiap wave ke-5 Banaspati datang lagi! Seberapa jauh kamu bertahan?
          </p>
        </div>
      </div>

      {/* ciri khas mode */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="endless-effect-chip">♾️ Gelombang tanpa batas</span>
        <span className="endless-effect-chip">🔥 Boss tiap 5 gelombang</span>
        <span className="endless-effect-chip">🏆 Rekor gelombang terjauh</span>
      </div>

      {/* tombol */}
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="btn-endless"
        onClick={startEndless}
      >
        <Play className="h-5 w-5 fill-current" />
        MULAI BERTAHAN!
        <span className="ml-1.5 text-[10px] font-bold opacity-80">dari gelombang 1</span>
      </motion.button>

      <p className="text-center text-[10px] font-bold text-teal-700/70">
        Skor mode ini masuk papan rekor 🏆 — gelombang terjauh jadi kenangan!
      </p>
    </motion.div>
  )
}
