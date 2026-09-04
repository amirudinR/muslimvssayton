'use client'

/* Modal menu: koleksi Lencana + Papan Rekor (leaderboard global).
   Ramah anak: bintang besar, warna emas, animasi bouncy. */

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, X, RefreshCw, Loader2, WifiOff } from 'lucide-react'
import { BADGES, isUnlocked } from '@/lib/game/achievements'
import { audio } from '@/lib/game/audio'

export interface LeaderEntry {
  id: number
  name: string
  stars: number
  wave: number
  defeated: number
  pahala: number
  createdAt: string
  /** P8: mode asal skor — "Klasik" | "Daring Harian" | "Tantangan Mingguan" | "Level N" */
  mode?: string
}

/* ------------------------------ Modal dasar ------------------------------ */

function CuteModal({
  title,
  emoji,
  onClose,
  children,
}: {
  title: string
  emoji: string
  onClose: () => void
  children: React.ReactNode
}) {
  // Escape menutup modal (ramah keyboard)
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    },
    [onClose],
  )
  useEffect(() => {
    window.addEventListener('keydown', onKey, true) // capture agar mod menang sebelum handler lain
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onKey])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/35 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.6, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className="panel-cute flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-5 pt-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-[#4a3b20]">
            <span className="animate-bounce-soft text-3xl">{emoji}</span>
            {title}
          </h2>
          <button className="btn-round" aria-label="Tutup" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">{children}</div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------ Lencana Ku ------------------------------ */

export function BadgesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <CuteModal title="Lencana Ku" emoji="🏅" onClose={onClose}>
          <div className="grid max-h-[52vh] grid-cols-3 gap-2.5 overflow-y-auto pr-1">
            {BADGES.map((b, i) => {
              const unlocked = isUnlocked(b.id)
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 18 }}
                  className={`badge-card ${unlocked ? '' : 'badge-locked'}`}
                  title={unlocked ? b.desc : 'Belum terbuka — main terus ya!'}
                >
                  <span className="text-3xl leading-none">{unlocked ? b.emoji : '🔒'}</span>
                  <span className="text-[11px] font-black leading-tight text-[#4a3b20]">{b.name}</span>
                  <span className="text-[9px] font-bold leading-tight text-[#8a6a30]">
                    {unlocked ? b.desc : '???'}
                  </span>
                </motion.div>
              )
            })}
          </div>
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2.5 text-center text-xs font-bold text-[#3d5a3a]">
            💚 Kumpulkan semua lencana dengan bermain dan berbuat baik!
          </p>
        </CuteModal>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------ Papan Rekor ------------------------------ */

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${stars} bintang`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stars ? '' : 'opacity-25 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  )
}

export function LeaderboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchBoard = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' })
      if (!res.ok) throw new Error('gagal')
      const json = (await res.json()) as { ok: boolean; entries: LeaderEntry[] }
      setEntries(json.entries)
    } catch {
      setError(true)
      setEntries(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && entries === null && !loading) void fetchBoard()
  }, [open, entries, loading, fetchBoard])

  return (
    <AnimatePresence>
      {open && (
        <CuteModal title="Papan Rekor" emoji="🏆" onClose={onClose}>
          <div className="flex items-center justify-between gap-2 pb-2">
            <p className="text-xs font-bold text-[#8a6a30]">Penjaga masjid terhebat se-Indonesia! 🇮🇩</p>
            <button
              className="btn-round"
              aria-label="Muat ulang"
              onClick={() => {
                audio.chime()
                void fetchBoard()
              }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
            {loading && entries === null && (
              <div className="flex flex-col items-center gap-2 py-8 text-[#8a6a30]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="text-sm font-bold">Memuat papan rekor…</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-rose-50 px-4 py-6 text-rose-700">
                <WifiOff className="h-8 w-8" />
                <span className="text-sm font-bold">Aduh, gagal memuat. Coba lagi ya!</span>
                <button className="btn-cute-secondary" onClick={() => void fetchBoard()}>
                  Coba Lagi
                </button>
              </div>
            )}
            {entries && entries.length === 0 && (
              <div className="py-8 text-center text-sm font-bold text-[#8a6a30]">
                Belum ada rekor — jadilah yang pertama! 🥇
              </div>
            )}
            {entries?.map((e, i) => (
              <div key={e.id} className={`lb-row ${i === 0 ? 'lb-row-1' : i === 1 ? 'lb-row-2' : i === 2 ? 'lb-row-3' : 'lb-row-n'}`}>
                <span className="flex items-center justify-center text-base font-black text-[#7a4a10]">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <span className="flex flex-col overflow-hidden">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-black text-[#4a3b20]">{e.name}</span>
                    {e.mode && e.mode !== 'Klasik' && (
                      <span
                        className={`lb-mode-chip ${
                          e.mode === 'Daring Harian'
                            ? 'lb-mode-daily'
                            : e.mode === 'Tantangan Mingguan'
                              ? 'lb-mode-weekly'
                              : 'lb-mode-level'
                        }`}
                        title={`Mode: ${e.mode}`}
                      >
                        {e.mode === 'Daring Harian' ? '🔥' : e.mode === 'Tantangan Mingguan' ? '📅' : '🗺️'} {e.mode}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-[#8a6a30]">
                    👻 {e.defeated} · 🛡️ gel. {e.wave} · 🌟 {e.pahala}
                  </span>
                </span>
                <StarRow stars={e.stars} />
              </div>
            ))}
          </div>
        </CuteModal>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Tombol pembuka (dipakai menu & layar menang) ---------------- */

export function MenuBadgesButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="btn-cute-secondary flex items-center gap-1.5 !text-xs"
      onClick={() => {
        audio.chime()
        onClick()
      }}
    >
      <Medal className="h-4 w-4" />
      Lencana Ku
    </motion.button>
  )
}

export function MenuLeaderboardButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="btn-cute flex items-center gap-1.5 !text-xs"
      onClick={() => {
        audio.chime()
        onClick()
      }}
    >
      <Trophy className="h-4 w-4" />
      Papan Rekor
    </motion.button>
  )
}
