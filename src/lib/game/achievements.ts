/* ============================================================
 * PENJAGA MASJID — Lencana (Achievements)
 * Badges lucu yang terbuka dari event gameplay, tersimpan
 * di localStorage lewat modul persist.
 * ============================================================ */

import { loadSave, saveSave, type SaveData } from './persist'
import { gameStore } from './store'
import { audio } from './audio'
import { dailyKey, weeklyKey } from './data'

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
  { id: 'weekly_win', name: 'Penjaga Pekanan', desc: 'Menangkan Tantangan Mingguan', emoji: '📅' },
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
    | 'weeklyWin'
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
    case 'weeklyWin': {
      unlock('weekly_win')
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

/* ---------------- tantangan mingguan (P9) ---------------- */

/** info streak tantangan mingguan */
export function getWeeklyStreakInfo(): { streak: number; lastWin: string | null } {
  const s = getSave()
  return { streak: s.weeklyStreak, lastWin: s.lastWeeklyWin }
}

/** catat kemenangan tantangan mingguan pekan ini — kembalikan streak baru. */
export function recordWeeklyWin(weekKey: string): number {
  const s = getSave()
  if (s.lastWeeklyWin === weekKey) return s.weeklyStreak // sudah dicatat pekan ini
  const prevWeekKey = weeklyKey(new Date(Date.now() - 7 * 86400000))
  s.weeklyStreak = s.lastWeeklyWin === prevWeekKey ? s.weeklyStreak + 1 : 1
  s.lastWeeklyWin = weekKey
  flush()
  return s.weeklyStreak
}

/* ---------------- P3: Level Select ---------------- */

export interface LevelProgressView {
  levelStars: number[]
  bestLevelDone: number
  totalStars: number
}

export function getLevelProgress(): LevelProgressView {
  const s = getSave()
  const total = s.levelStars.reduce((a, b) => a + b, 0)
  return { levelStars: [...s.levelStars], bestLevelDone: s.bestLevelDone, totalStars: total }
}

/** catat hasil level: simpan rating bintang terbaik + buka level berikutnya. */
export function recordLevelResult(levelId: number, stars: number): { newUnlock: boolean; newBest: boolean } {
  const s = getSave()
  const idx = levelId - 1
  while (s.levelStars.length < idx + 1) s.levelStars.push(0)
  const prev = s.levelStars[idx] ?? 0
  const newBest = stars > prev
  if (newBest) s.levelStars[idx] = stars
  const newUnlock = levelId > s.bestLevelDone
  if (levelId > s.bestLevelDone) s.bestLevelDone = levelId
  flush()
  return { newUnlock, newBest }
}

/* ---------------- P4: Toko (currency bintang + koleksi) ---------------- */

export function getStarCurrency(): number {
  return getSave().starCurrency
}

export function addStarCurrency(amount: number) {
  const s = getSave()
  s.starCurrency = Math.max(0, Math.round(s.starCurrency + amount))
  flush()
}

/** konversi pahala akhir run → bintang toko (20 pahala = 1 bintang). */
export function grantRunReward(pahala: number): number {
  const gain = Math.floor(pahala / 20)
  if (gain > 0) addStarCurrency(gain)
  return gain
}

export function getOwnedChars(): string[] {
  return [...getSave().ownedChars]
}

export function buyChar(id: string, cost: number): boolean {
  const s = getSave()
  if (s.ownedChars.includes(id)) return false
  if (s.starCurrency < cost) return false
  s.starCurrency -= cost
  s.ownedChars = [...s.ownedChars, id]
  flush()
  return true
}

/* ---------------- P9-b: statistik pemakaian karakter ---------------- */

/** salinan defensif map pemakaian (id gameplay → { placed, wins }). */
export function getCharUsage(): Record<string, { placed: number; wins: number }> {
  const out: Record<string, { placed: number; wins: number }> = {}
  const src = getSave().charUsage
  if (!src || typeof src !== 'object') return out
  for (const [id, u] of Object.entries(src)) {
    if (!u || typeof u !== 'object') continue
    out[id] = { placed: u.placed ?? 0, wins: u.wins ?? 0 }
  }
  return out
}

/* ------------------ P10: KARAKTER ANDALAN (MVP PEMAIN) ------------------ */

export interface FavoriteChar {
  /** id gameplay (mis. 'ali', 'gen-13', 'custom-1') */
  id: string
  placed: number
  wins: number
}

/** Karakter andalan = pemakaian terbanyak (tie-break kemenangan terbanyak).
 *  null bila belum ada riwayat pemakaian. */
export function getFavoriteChar(): FavoriteChar | null {
  const usage = getCharUsage()
  let best: FavoriteChar | null = null
  for (const [id, u] of Object.entries(usage)) {
    if (u.placed <= 0) continue
    if (
      !best ||
      u.placed > best.placed ||
      (u.placed === best.placed && u.wins > best.wins)
    ) {
      best = { id, placed: u.placed, wins: u.wins }
    }
  }
  return best
}

/** gelar kebanggaan utk karakter andalan berdasar jumlah kemenangan. */
export function favoriteTitle(wins: number): string {
  if (wins >= 10) return 'Legenda Masjid 🏆'
  if (wins >= 6) return 'Bintang Lapangan ⭐'
  if (wins >= 3) return 'Penjaga Setia 🛡️'
  return 'Pemain Andalan 🌱'
}

/** catat satu penempatan karakter (engine → setelah placeTower sukses). */
export function recordCharPlaced(charId: string): void {
  const s = getSave()
  if (!s.charUsage || typeof s.charUsage !== 'object') s.charUsage = {}
  const cur = s.charUsage[charId] ?? { placed: 0, wins: 0 }
  s.charUsage[charId] = { placed: cur.placed + 1, wins: cur.wins }
  flush()
}

/** catat kemenangan utk tiap karakter unik yang ikut bertugas menang. */
export function recordCharsWon(charIds: string[]): void {
  if (charIds.length === 0) return
  const s = getSave()
  if (!s.charUsage || typeof s.charUsage !== 'object') s.charUsage = {}
  for (const id of new Set(charIds)) {
    const cur = s.charUsage[id] ?? { placed: 0, wins: 0 }
    s.charUsage[id] = { placed: cur.placed, wins: cur.wins + 1 }
  }
  flush()
}
