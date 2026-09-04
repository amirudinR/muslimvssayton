'use client'

/* Kartu Tantangan Hari Ini untuk menu utama: modifier date-seeded,
   streak menang beruntun, dan tombol langsung main. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Play, CalendarHeart } from 'lucide-react'
import { pickDailyModifier, dailyKey } from '@/lib/game/data'
import { getDailyStreakInfo } from '@/lib/game/achievements'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function DailyChallengeCard() {
  const [mod] = useState(() => pickDailyModifier())
  const [streakInfo] = useState(() => getDailyStreakInfo())
  const [today] = useState(() => new Date())

  const dayName = DAY_NAMES[today.getDay()]
  const wonToday = streakInfo.lastWin === dailyKey(today)

  const startDaily = () => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame({ daily: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.45 }}
      className="daily-card pointer-events-auto mx-4 flex w-full max-w-lg flex-col gap-2 px-4 py-3 sm:px-5"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-orange-600 sm:text-sm">
          <Flame className="h-4 w-4 fill-orange-400 text-orange-500" />
          Tantangan Hari Ini
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[10px] font-black text-orange-700 sm:text-[11px]">
          <CalendarHeart className="h-3 w-3" />
          {dayName}
        </span>
      </div>

      {/* modifier */}
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="text-4xl drop-shadow sm:text-5xl"
          aria-hidden
        >
          {mod.emoji}
        </motion.span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-black text-[#7a3a10] sm:text-lg">{mod.name}</p>
          <p className="text-[11px] font-bold leading-snug text-[#9a5a2a] sm:text-xs">{mod.desc}</p>
        </div>
      </div>

      {/* chip efek */}
      <div className="flex flex-wrap items-center gap-1.5">
        {mod.effects.map((e) => (
          <span key={e} className="daily-effect-chip">
            {e}
          </span>
        ))}
      </div>

      {/* streak + tombol */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {streakInfo.streak > 0 ? (
          <span className="streak-pill" title="Hari berturut-turut menang tantangan">
            🔥 {streakInfo.streak} hari beruntun{wonToday ? ' · hari ini menang! ✅' : ''}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-orange-700/70">
            Menang tiap hari untuk mulai rentetan! 🔥
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 1 }}
          whileTap={{ scale: 0.94 }}
          className="btn-daily"
          onClick={startDaily}
        >
          <Play className="h-4 w-4 fill-current" />
          {wonToday ? 'Main Lagi?' : 'MAIN TANTANGAN!'}
        </motion.button>
      </div>

      <p className="text-center text-[9px] font-bold text-orange-700/60">
        Skor mode tantangan tidak masuk papan rekor 🏆
      </p>
    </motion.div>
  )
}
