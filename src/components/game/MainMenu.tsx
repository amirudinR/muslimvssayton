'use client'

/* P3: MAIN MENU PROFESIONAL — logo + judul dengan scene 3D masjid hidup
   (background engine menu orbit), profil pemain (avatar + bintang total),
   tombol besar: Main (level select), Toko, Tantangan Harian, Pengaturan,
   plus lencana & papan rekor. */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, ShoppingBag, Map, Settings as SettingsIcon, Star, Trophy, Medal,
  GraduationCap, ChevronRight, BookOpen,
} from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { getRecords, BADGES, getLevelProgress, getStarCurrency, getOwnedChars } from '@/lib/game/achievements'
import { openCollection } from '@/lib/game/collection'
import { LEVELS, MAX_STARS } from '@/lib/game/levels'
import {
  BadgesModal,
  LeaderboardModal,
  MenuBadgesButton,
  MenuLeaderboardButton,
} from './MenuModals'
import { DailyChallengeCard } from './DailyChallenge'

const AVATARS = ['🤲', '📖', '💝', '💧', '💡', '📢']

export function MainMenu() {
  const screen = useGameStore((s) => s.screen)
  const [showBadges, setShowBadges] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  // data dibaca saat menu aktif (localStorage — hanya client)
  const [records] = useState(() => (typeof window !== 'undefined' ? getRecords() : null))
  const [levelProg] = useState(() => (typeof window !== 'undefined' ? getLevelProgress() : null))
  const [starCur] = useState(() => (typeof window !== 'undefined' ? getStarCurrency() : 0))
  const [ownedCount] = useState(
    () => (typeof window !== 'undefined' ? 2 + getOwnedChars().filter((id) => id !== 'hero-ali' && id !== 'hero-aisyah').length : 0),
  )

  if (screen !== 'menu') return null

  const go = (s: 'levels' | 'shop' | 'settings') => {
    audio.ensure()
    audio.chime()
    useGameStore.getState().setScreen(s)
  }

  const replayTutorial = () => {
    audio.ensure()
    audio.chime()
    getEngine()?.startGame({ forceTutorial: true })
  }

  const nextLevel = Math.min((levelProg?.bestLevelDone ?? 0) + 1, LEVELS.length)
  const nextLvlDef = LEVELS[nextLevel - 1]

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col">
      {/* hiasan melayang lucu di belakang panel */}
      <motion.span
        aria-hidden
        animate={{ y: [0, -14, 0], rotate: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-[5%] top-[14%] text-5xl opacity-70 drop-shadow-lg"
      >
        🌟
      </motion.span>
      <motion.span
        aria-hidden
        animate={{ y: [0, 12, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[6%] top-[22%] text-5xl opacity-70 drop-shadow-lg"
      >
        🎈
      </motion.span>
      <motion.span
        aria-hidden
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[12%] bottom-[32%] text-4xl opacity-60 drop-shadow-lg"
      >
        🦋
      </motion.span>

      {/* ---------- PROFIL PEMAIN (pojok atas) ---------- */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 pt-3"
      >
        <div className="profile-chip">
          <span className="profile-avatar">{AVATARS[(records?.gamesPlayed ?? 0) % AVATARS.length]}</span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-black text-[#4a3b20]">
              {records?.playerName || 'Penjaga Masjid'}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              {levelProg ? `${levelProg.totalStars}/${MAX_STARS} bintang` : '0 bintang'}
            </span>
          </div>
        </div>
        {/* currency toko */}
        <div className="profile-chip !gap-1.5">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          <span className="text-sm font-black text-amber-600">{starCur}</span>
        </div>
      </motion.div>

      {/* ---------- Area utama ---------- */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-2">
        <div className="flex w-full max-w-lg flex-col items-center gap-2.5">
          {/* Kartu judul */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
            className="panel-cute pointer-events-auto mx-4 flex max-w-lg flex-col items-center gap-2 px-6 py-4 text-center sm:px-8 sm:py-5"
          >
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="text-5xl drop-shadow-md sm:text-6xl"
            >
              🕌
            </motion.div>
            <h1 className="title-shimmer text-3xl font-black leading-tight tracking-wide drop-shadow-sm sm:text-4xl">
              PENJAGA MASJID
            </h1>
            <p className="-mt-1.5 rounded-full bg-amber-100 px-4 py-1 text-xs font-extrabold text-amber-700 shadow-inner sm:text-sm">
              Anak Sholeh vs Setan Jahil 👻
            </p>

            {/* Rekor ringkas */}
            {records && records.gamesPlayed > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="record-pill !px-2 !py-0.5 text-[11px]">
                  <Trophy className="h-3 w-3 text-amber-500" /> {records.wins} menang
                </span>
                <span className="record-pill !px-2 !py-0.5 text-[11px]">
                  <Medal className="h-3 w-3 text-rose-400" /> {records.achievements.length}/{BADGES.length} lencana
                </span>
                <span className="record-pill !px-2 !py-0.5 text-[11px]">
                  🗺️ Lv.{levelProg?.bestLevelDone ?? 0}/{LEVELS.length}
                </span>
              </div>
            )}
          </motion.div>

          {/* ---------- Tombol besar MENU UTAMA ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="pointer-events-auto mx-4 flex w-full max-w-lg flex-col gap-2"
          >
            {/* MAIN — lanjut level berikutnya */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-cute-lg relative w-full !py-3.5"
              onClick={() => {
                audio.ensure()
                audio.tada()
                useGameStore.getState().setScreen('levels')
              }}
            >
              <Play className="h-6 w-6 fill-current" />
              MAIN!
              <span className="ml-2 hidden rounded-full bg-white/40 px-2.5 py-0.5 text-[11px] font-black text-amber-800 sm:inline">
                {nextLvlDef ? `Lanjut: Lv.${nextLevel} ${nextLvlDef.emoji}` : 'Semua level selesai! 🏆'}
              </span>
              <ChevronRight className="absolute right-4 h-5 w-5 opacity-70" />
            </motion.button>

            {/* Baris menu sekunder */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }} className="menu-tile" onClick={() => go('shop')}>
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                <span className="text-xs font-black">TOKO</span>
                <span className="text-[9px] font-bold opacity-70">100 karakter!</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="menu-tile relative"
                onClick={() => {
                  audio.ensure()
                  audio.chime()
                  openCollection()
                }}
              >
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-black">KOLEKSI</span>
                <span className="text-[9px] font-bold opacity-70">{ownedCount} dimiliki</span>
                {ownedCount > 2 && (
                  <span className="absolute -right-1.5 -top-1.5 flex items-center gap-0.5 rounded-full border-2 border-white bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                    {ownedCount}✨
                  </span>
                )}
              </motion.button>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }} className="menu-tile" onClick={() => go('levels')}>
                <Map className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-black">PETA</span>
                <span className="text-[9px] font-bold opacity-70">8 level seru</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }} className="menu-tile" onClick={() => go('settings')}>
                <SettingsIcon className="h-5 w-5 text-sky-600" />
                <span className="text-xs font-black">ATURAN</span>
                <span className="text-[9px] font-bold opacity-70">Suara & kualitas</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Kartu Tantangan Hari Ini */}
          <DailyChallengeCard />
        </div>
      </div>

      {/* ---------- Kontrol bawah ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="pointer-events-auto mx-auto mb-2 flex w-full max-w-lg shrink-0 flex-col items-center gap-1.5 px-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MenuBadgesButton onClick={() => setShowBadges(true)} />
          <MenuLeaderboardButton onClick={() => setShowBoard(true)} />
          {records?.tutorialSeen && (
            <button
              className="btn-cute-secondary !px-3 !py-1.5 !text-xs"
              onClick={replayTutorial}
              title="Ulangi tutorial interaktif"
            >
              <GraduationCap className="h-4 w-4" />
              Tutorial
            </button>
          )}
        </div>

        {/* Footer sticky bawah */}
        <footer className="pointer-events-none w-full bg-gradient-to-t from-emerald-900/40 to-transparent py-1 text-center">
          <p className="text-[11px] font-bold text-white/85 drop-shadow sm:text-xs">
            🌟 Dibuat dengan cinta untuk anak-anak sholeh — jangan lupa sholat ya! 🌟
          </p>
        </footer>
      </motion.div>

      {/* Modal lencana & papan rekor */}
      <BadgesModal open={showBadges} onClose={() => setShowBadges(false)} />
      <LeaderboardModal open={showBoard} onClose={() => setShowBoard(false)} />
    </div>
  )
}
