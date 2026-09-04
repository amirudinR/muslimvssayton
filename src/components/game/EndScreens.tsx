'use client'

/* Layar akhir: kemenangan (bintang rating + kirim skor ke papan rekor +
   kembang api), kekalahan lembut, dan menu jeda. Semua ramah anak. */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, RotateCcw, Home, Pause, Volume2, VolumeX, Music, Music2,
  Trophy, Send, Loader2, CheckCircle2,
} from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import { setPlayerName, getRecords } from '@/lib/game/achievements'
import { LeaderboardModal } from './MenuModals'

/* ------------------- Kartu saran Kakek Imam (Smart Coach) ------------------- */

function CoachTipsCard() {
  const coachTips = useGameStore((s) => s.coachTips)
  if (!coachTips || coachTips.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.45 }}
      className="coach-card relative w-full text-left"
      role="complementary"
      aria-label="Saran Kakek Imam"
    >
      <div className="coach-avatar" aria-hidden>
        👴
      </div>
      <p className="pl-12 text-xs font-black uppercase tracking-widest text-emerald-700">
        Saran Kakek Imam
      </p>
      <ul className="mt-1 space-y-1.5 pl-12">
        {coachTips.map((tip, i) => (
          <motion.li
            key={tip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.22 }}
            className="flex items-start gap-1.5 rounded-xl bg-white/70 px-2.5 py-1.5 text-xs font-bold leading-snug text-[#3d5a3a]"
          >
            <span className="mt-0.5 shrink-0 text-sm">💡</span>
            {tip}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ------------------- Bintang rating lucu ------------------- */

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Rating ${stars} dari 3 bintang`}>
      {[1, 2, 3].map((i) => {
        const on = i <= stars
        return (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -60, y: -30 }}
            animate={{ scale: on ? 1 : 0.8, rotate: 0, y: 0 }}
            transition={{ delay: 0.35 + i * 0.28, type: 'spring', stiffness: 380, damping: 12 }}
            className={`star-big text-5xl ${on ? '' : 'star-empty'}`}
          >
            {on ? '⭐' : '☆'}
          </motion.span>
        )
      })}
    </div>
  )
}

/* ------------------- Form kirim skor ------------------- */

function ScoreSubmit({ stars, wave, defeated, pahala }: { stars: number; wave: number; defeated: number; pahala: number }) {
  const scoreSubmitted = useGameStore((s) => s.scoreSubmitted)
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBoard, setShowBoard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // default: nama terakhir dipakai
    const saved = getRecords().playerName
    if (saved) setName(saved)
  }, [])

  if (scoreSubmitted) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm font-black text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Skor terkirim ke papan rekor!
        </div>
        <button
          className="btn-cute-secondary flex items-center gap-1.5 !text-xs"
          onClick={() => {
            audio.chime()
            setShowBoard(true)
          }}
        >
          <Trophy className="h-4 w-4" />
          Lihat Papan Rekor
        </button>
        <LeaderboardModal open={showBoard} onClose={() => setShowBoard(false)} />
      </div>
    )
  }

  const submit = async () => {
    const clean = name.trim()
    if (clean.length < 2 || sending) {
      setError('Nama minimal 2 huruf ya! 😊')
      inputRef.current?.focus()
      return
    }
    setSending(true)
    setError(null)
    try {
      setPlayerName(clean)
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean, stars, wave, defeated, pahala }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'gagal')
      audio.tada()
      useGameStore.getState().setScoreSubmitted(true)
    } catch {
      setError('Aduh, gagal mengirim. Cek jaringan lalu coba lagi! 🙏')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-amber-200 bg-[#fffbe8] px-4 py-3">
      <span className="text-xs font-black uppercase tracking-wider text-amber-600">
        Masuk Papan Rekor? 🏆
      </span>
      <div className="flex w-full gap-1.5">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, 16))
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
          placeholder="Nama kamu…"
          maxLength={16}
          className="min-w-0 flex-1 rounded-full border-[3px] border-amber-300 bg-white px-4 py-1.5 text-sm font-black text-[#4a3b20] placeholder:font-bold placeholder:text-stone-300 focus:border-amber-400 focus:outline-none"
          aria-label="Nama untuk papan rekor"
        />
        <button
          className="btn-cute !px-4 !py-1.5 !text-sm"
          disabled={sending}
          onClick={() => void submit()}
          aria-label="Kirim skor"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
    </div>
  )
}

/* ------------------- Layar-layar akhir ------------------- */

export function EndScreens() {
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)
  const stats = useGameStore((s) => s.stats)
  const soundOn = useGameStore((s) => s.soundOn)
  const musicOn = useGameStore((s) => s.musicOn)
  const mosqueHp = useGameStore((s) => s.mosqueHp)
  const mosqueMaxHp = useGameStore((s) => s.mosqueMaxHp)
  const resultStars = useGameStore((s) => s.resultStars)
  const dailyMode = useGameStore((s) => s.dailyMode)
  const dailyMod = useGameStore((s) => s.dailyMod)
  const dailyStreakResult = useGameStore((s) => s.dailyStreakResult)

  const restart = () => getEngine()?.startGame(dailyMode ? { daily: true } : undefined)
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
              className="panel-cute relative flex max-h-[92vh] max-w-md flex-col items-center gap-3 overflow-y-auto px-8 py-7 text-center"
            >
              {/* hiasan bintang berputar */}
              <span className="animate-spin-slow absolute -left-4 -top-4 text-5xl opacity-60">✨</span>
              <span className="animate-spin-slow absolute -bottom-3 -right-3 text-5xl opacity-60">🎉</span>

              <span className="animate-bounce-soft text-6xl sm:text-7xl">🕌</span>
              <h2 className="text-3xl font-black tracking-wide text-emerald-700 sm:text-4xl">
                ALHAMDULILLAH!
              </h2>

              <StarRating stars={resultStars} />
              <p className="-mt-1 text-sm font-extrabold text-[#6a4d1a]">
                {resultStars >= 3
                  ? 'Sempurna! Masjid selamat tanpa cek-cerek! 💫'
                  : resultStars === 2
                    ? 'Hebat! Tinggal sedikit lagi sempurna! 😊'
                    : 'Menang! Coba jaga masjid lebih rapat lagi ya! 💪'}
              </p>

              {/* Tantangan Harian selesai */}
              {dailyMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 16 }}
                  className="daily-won-banner"
                >
                  <motion.span
                    animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="inline-block text-2xl"
                  >
                    🔥
                  </motion.span>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white drop-shadow">
                      Tantangan Hari Ini Selesai!
                    </span>
                    <span className="text-[11px] font-bold text-orange-100">
                      {dailyMod ? `${dailyMod.emoji} ${dailyMod.name} · ` : ''}
                      {dailyStreakResult > 1
                        ? `${dailyStreakResult} hari beruntun! 🔥`
                        : 'Rentetan dimulai — menang lagi besok! 🔥'}
                    </span>
                  </div>
                </motion.div>
              )}

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
                  <span>🕌 Kesehatan masjid</span>
                  <span className="font-black text-sky-600">{mosqueHp}/{mosqueMaxHp}</span>
                </p>
              </div>

              {/* Mode tantangan tidak masuk papan rekor */}
              {dailyMode ? (
                <p className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
                  🔥 Mode tantangan — skor tidak masuk papan rekor 🏆
                </p>
              ) : (
                <ScoreSubmit
                  stars={resultStars}
                  wave={stats.wavesCleared}
                  defeated={stats.defeated}
                  pahala={stats.starsEarned}
                />
              )}

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

              {/* Saran personal dari analisis gaya main */}
              <CoachTipsCard />
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
