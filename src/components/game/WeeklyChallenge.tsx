'use client'

/* P9: Kartu Tantangan Mingguan untuk menu utama: modifier pekan-seeded
   (lebih sulit), streak menang pekan beruntun, bonus ⭐ toko besar,
   dan skor tetap masuk papan rekor. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CalendarDays } from 'lucide-react'
import { pickWeeklyModifier, weeklyKey, daysUntilNextWeek } from '@/lib/game/data'
import { getWeeklyStreakInfo } from '@/lib/game/achievements'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'

export function WeeklyChallengeCard() {
  const [wmod] = useState(() => pickWeeklyModifier())
  const [streakInfo] = useState(() => getWeeklyStreakInfo())
  const [now] = useState(() => new Date())

  const thisWeek = weeklyKey(now)
  const wonThisWeek = streakInfo.lastWin === thisWeek
  const weekNo = parseInt(thisWeek.split('W')[1] ?? '1', 10)
  const daysLeft = daysUntilNextWeek()

  const startWeekly = () => {
    audio.ensure()
    audio.tada()
    getEngine()?.startGame({ weekly: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.55 }}
      className="weekly-card pointer-events-auto mx-4 flex w-full max-w-lg flex-col gap-2 px-4 py-3 sm:px-5"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-violet-600 sm:text-sm">
          <CalendarDays className="h-4 w-4 text-violet-500" />
          Tantangan Mingguan
        </span>
        <span className="weekly-week-chip">Pekan {weekNo}</span>
      </div>

      {/* modifier */}
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="text-4xl drop-shadow sm:text-5xl"
          aria-hidden
        >
          {wmod.emoji}
        </motion.span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-black text-[#5b21b6] sm:text-lg">{wmod.name}</p>
          <p className="text-[11px] font-bold leading-snug text-[#6d28d9] sm:text-xs">{wmod.desc}</p>
        </div>
      </div>

      {/* chip efek */}
      <div className="flex flex-wrap items-center gap-1.5">
        {wmod.effects.map((e) => (
          <span key={e} className="weekly-effect-chip">
            {e}
          </span>
        ))}
      </div>

      {/* bonus bintang toko */}
      <span className="weekly-reward-pill" title="Bonus bintang toko jika menang">
        🏆 Bonus +{wmod.rewardStars}⭐ kalau menang!
      </span>

      {/* streak + tombol */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {streakInfo.streak > 0 ? (
          <span className="weekly-streak-pill" title="Pekan berturut-turut menang tantangan">
            🔥 {streakInfo.streak} pekan beruntun{wonThisWeek ? ' · pekan ini menang! ✅' : ''}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-violet-700/70">
            Menang tiap pekan untuk juara sejati! 🔥
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 1 }}
          whileTap={{ scale: 0.94 }}
          className="btn-weekly"
          onClick={startWeekly}
        >
          <Play className="h-4 w-4 fill-current" />
          {wonThisWeek ? 'Main Lagi Minggu Ini?' : 'TERIMA TANTANGAN!'}
        </motion.button>
      </div>

      <p className="text-center text-[9px] font-bold text-violet-700/60">
        Pekan baru dalam {daysLeft} hari · Lebih sulit dari biasanya, tapi skor masuk papan rekor! 💪
      </p>
    </motion.div>
  )
}
