/* ============================================================
 * PENJAGA MASJID — Lencana (Achievements)
 * Badges lucu yang terbuka dari event gameplay, tersimpan
 * di localStorage lewat modul persist.
 * ============================================================ */

import { loadSave, saveSave, type SaveData } from './persist'
import { gameStore } from './store'
import { audio } from './audio'
import { dailyKey } from './data'

export interface BadgeDef {
  id: string
  name: string
  desc: string
  emoji: string
}

export const BADGES: BadgeDef[] = [
  { id: 'first_tower', name: 'Penjaga Baru', desc: 'Memasang anak sholeh pertamamu', emoji: '🤲' },
  { id: 'kills_10', name: 'Pembela Cilik', desc: 'Menghalau 10 setan', emoji: '🎯' },
  { id: 'kills_50', name: 'Ksatria Masjid', desc: 'Menghalau 50 setan', emoji: '💪' },
  { id: 'kills_150', name: 'Pahlawan Papan Atas', desc: 'Menghalau 150 setan', emoji: '🏅' },
  { id: 'wave_5', name: 'Setengah Jalan', desc: 'Mencapai gelombang 5', emoji: '🛡️' },
  { id: 'first_win', name: 'Alhamdulillah!', desc: 'Memenangkan pertandingan', emoji: '🏆' },
  { id: 'perfect_win', name: 'Sempurna 3 Bintang', desc: 'Menang dengan 3 bintang', emoji: '⭐' },
  { id: 'dua_1', name: 'Hati yang Berserah', desc: 'Menggunakan Doa Bersama', emoji: '✨' },
  { id: 'dua_5', name: 'Ahli Doa', desc: 'Menggunakan Doa Bersama 5 kali', emoji: '🌟' },
  { id: 'pahala_1000', name: 'Dermawan', desc: 'Mengumpulkan 1000 pahala sekali main', emoji: '💝' },
  { id: 'squad_8', name: 'Regu Anak Sholeh', desc: 'Memasang 8 anak sholeh sekaligus', emoji: '👨‍👩‍👧‍👦' },
  { id: 'kuyang', name: 'Penangkap Kuyang', desc: 'Menghalau Kuyang Melayang lucu', emoji: '🎈' },
  { id: 'sedekah_300', name: 'Jutawan Sedekah', desc: 'Kotak sedekah Misbah menghasilkan 300 pahala', emoji: '💰' },
  { id: 'tutorial_done', name: 'Murid Rajin', desc: 'Menyelesaikan tutorial Kakek Imam', emoji: '🎓' },
  { id: 'daily_win', name: 'Juara Harian', desc: 'Menang Tantangan Hari Ini', emoji: '🔥' },
]

let saveCache: SaveData | null = null

function getSave(): SaveData {
  if (!saveCache) saveCache = loadSave()
  return saveCache
}

function flush() {
  if (saveCache) saveSave(saveCache)
}

export function getUnlockedIds(): string[] {
  return getSave().achievements
}

export function isUnlocked(id: string): boolean {
  return getSave().achievements.includes(id)
}

/** Buka lencana (idempotent) → toast lucu + simpan. */
function unlock(id: string) {
  const save = getSave()
  if (save.achievements.includes(id)) return
  const def = BADGES.find((b) => b.id === id)
  if (!def) return
  save.achievements = [...save.achievements, id]
  flush()
  const st = gameStore.get()
  st.showBadgeToast(def.name, def.emoji, def.desc)
  audio.tada()
}

/* ---------------- konteks event dari engine ---------------- */

export interface BadgeCtx {
  event:
    | 'towerPlaced'
    | 'enemyKilled'
    | 'waveComplete'
    | 'victory'
    | 'gameOver'
    | 'duaUsed'
    | 'pahalaChanged'
    | 'sedekahTick'
    | 'tutorialDone'
    | 'dailyWin'
  enemyId?: string
  wave?: number
  stars?: number
  towersCount?: number
  pahala?: number
  /** total pahala yang dihasilkan Misbah pertandingan ini */
  misbahGen?: number
}

export function checkBadges(ctx: BadgeCtx) {
  const save = getSave()
  switch (ctx.event) {
    case 'towerPlaced':
      unlock('first_tower')
      if ((ctx.towersCount ?? 0) >= 8) unlock('squad_8')
      break
    case 'enemyKilled': {
      save.totalDefeated += 1
      flush()
      unlock('kills_10')
      if (save.totalDefeated >= 50) unlock('kills_50')
      if (save.totalDefeated >= 150) unlock('kills_150')
      if (ctx.enemyId === 'kuyang') unlock('kuyang')
      break
    }
    case 'waveComplete': {
      const w = ctx.wave ?? 0
      if (w > save.bestWave) {
        save.bestWave = w
        flush()
      }
      if (w >= 5) unlock('wave_5')
      break
    }
    case 'victory': {
      save.gamesPlayed += 1
      save.wins += 1
      const stars = ctx.stars ?? 1
      if (stars > save.bestStars) save.bestStars = stars
      if ((ctx.pahala ?? 0) > save.bestPahala) save.bestPahala = ctx.pahala ?? 0
      flush()
      unlock('first_win')
      if (stars >= 3) unlock('perfect_win')
      break
    }
    case 'gameOver': {
      save.gamesPlayed += 1
      flush()
      break
    }
    case 'duaUsed': {
      save.totalDuaUsed += 1
      flush()
      unlock('dua_1')
      if (save.totalDuaUsed >= 5) unlock('dua_5')
      break
    }
    case 'pahalaChanged': {
      if ((ctx.pahala ?? 0) >= 1000) unlock('pahala_1000')
      break
    }
    case 'sedekahTick': {
      if ((ctx.misbahGen ?? 0) >= 300) unlock('sedekah_300')
      break
    }
    case 'tutorialDone': {
      unlock('tutorial_done')
      break
    }
    case 'dailyWin': {
      unlock('daily_win')
      break
    }
  }
}

/* ---------------- API simpan/rekor untuk UI ---------------- */

export interface RecordsView {
  bestStars: number
  bestWave: number
  bestPahala: number
  gamesPlayed: number
  wins: number
  totalDefeated: number
  achievements: string[]
  playerName: string
  tutorialSeen: boolean
  dailyStreak: number
  lastDailyWin: string | null
}

export function getRecords(): RecordsView {
  const s = getSave()
  return {
    bestStars: s.bestStars,
    bestWave: s.bestWave,
    bestPahala: s.bestPahala,
    gamesPlayed: s.gamesPlayed,
    wins: s.wins,
    totalDefeated: s.totalDefeated,
    achievements: [...s.achievements],
    playerName: s.playerName,
    tutorialSeen: s.tutorialSeen,
    dailyStreak: s.dailyStreak,
    lastDailyWin: s.lastDailyWin,
  }
}

export function setPlayerName(name: string) {
  const s = getSave()
  s.playerName = name
  flush()
}

/** dipanggil engine saat game over agar gamesPlayed + totalStars tercatat */
export function recordSessionEnd(pahala: number) {
  const s = getSave()
  s.totalStars += pahala
  flush()
}

/* ---------------- tutorial / coach / tantangan harian ---------------- */

export function isTutorialSeen(): boolean {
  return getSave().tutorialSeen
}

export function markTutorialDone() {
  const s = getSave()
  if (s.tutorialSeen) return
  s.tutorialSeen = true
  flush()
}

/** naikkan kekalahan beruntun — mengembalikan nilai baru */
export function bumpLossStreak(): number {
  const s = getSave()
  s.lossStreak = Math.min(9, s.lossStreak + 1)
  flush()
  return s.lossStreak
}

export function clearLossStreak() {
  const s = getSave()
  if (s.lossStreak === 0) return
  s.lossStreak = 0
  flush()
}

export function getLossStreak(): number {
  return getSave().lossStreak
}

/** info streak tantangan harian */
export function getDailyStreakInfo(): { streak: number; lastWin: string | null } {
  const s = getSave()
  return { streak: s.dailyStreak, lastWin: s.lastDailyWin }
}

/** catat kemenangan tantangan harian hari ini — kembalikan streak baru. */
export function recordDailyWin(todayKey: string): number {
  const s = getSave()
  if (s.lastDailyWin === todayKey) return s.dailyStreak // sudah dicatat hari ini
  const yesterdayKey = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return dailyKey(d)
  })()
  s.dailyStreak = s.lastDailyWin === yesterdayKey ? s.dailyStreak + 1 : 1
  s.lastDailyWin = todayKey
  flush()
  return s.dailyStreak
}
