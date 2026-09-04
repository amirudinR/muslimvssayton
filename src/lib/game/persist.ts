/* ============================================================
 * PENJAGA MASJID — Persistence (localStorage)
 * Rekor, progres, dan lencana tersimpan antar sesi main.
 * Aman dipanggil dari client saja (guard SSR).
 * ============================================================ */

export interface SaveData {
  /** nama pemain untuk papan rekor */
  playerName: string
  /** bintang terbaik (1..3) dari kemenangan */
  bestStars: number
  /** pahala terbanyak dalam satu pertandingan */
  bestPahala: number
  /** gelombang terjauh yang dicapai */
  bestWave: number
  /** jumlah pertandingan dimainkan */
  gamesPlayed: number
  /** jumlah kemenangan */
  wins: number
  /** total setan dihalau (kumulatif) */
  totalDefeated: number
  /** total pahala terkumpul (kumulatif) */
  totalStars: number
  /** jumlah pakai kekuatan Doa Bersama (kumulatif) */
  totalDuaUsed: number
  /** id lencana yang sudah terbuka */
  achievements: string[]
  /** sudah melihat tutorial interaktif? */
  tutorialSeen: boolean
  /** kekalahan beruntun (untuk saran coach makin peka) */
  lossStreak: number
  /** hari berturut-turut menang Tantangan Harian */
  dailyStreak: number
  /** tanggal (YYYY-MM-DD) terakhir menang tantangan harian */
  lastDailyWin: string | null
  /** P3: rating bintang terbaik per level (index = levelId-1, nilai 0..3) */
  levelStars: number[]
  /** P3: level tertinggi yang sudah selesai (0 = belum ada) */
  bestLevelDone: number
  /** P4: karakter yang dibeli di toko (id generatif) */
  ownedChars: string[]
  /** P4: bintang currency untuk belanja di toko */
  starCurrency: number
}

const KEY = 'penjaga-masjid-save-v1'

const DEFAULT_SAVE: SaveData = {
  playerName: '',
  bestStars: 0,
  bestPahala: 0,
  bestWave: 0,
  gamesPlayed: 0,
  wins: 0,
  totalDefeated: 0,
  totalStars: 0,
  totalDuaUsed: 0,
  achievements: [],
  tutorialSeen: false,
  lossStreak: 0,
  dailyStreak: 0,
  lastDailyWin: null,
  levelStars: [],
  bestLevelDone: 0,
  ownedChars: [],
  starCurrency: 0,
}

export function loadSave(): SaveData {
  if (typeof window === 'undefined') return { ...DEFAULT_SAVE }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SAVE, achievements: [] }
    const parsed = JSON.parse(raw) as Partial<SaveData>
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      tutorialSeen: !!parsed.tutorialSeen,
      lossStreak: typeof parsed.lossStreak === 'number' ? parsed.lossStreak : 0,
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      lastDailyWin: typeof parsed.lastDailyWin === 'string' ? parsed.lastDailyWin : null,
      levelStars: Array.isArray(parsed.levelStars) ? parsed.levelStars.map((n) => Math.max(0, Math.min(3, n | 0))) : [],
      bestLevelDone: typeof parsed.bestLevelDone === 'number' ? parsed.bestLevelDone : 0,
      ownedChars: Array.isArray(parsed.ownedChars) ? parsed.ownedChars : [],
      starCurrency: typeof parsed.starCurrency === 'number' ? Math.max(0, Math.round(parsed.starCurrency)) : 0,
    }
  } catch {
    return { ...DEFAULT_SAVE, achievements: [] }
  }
}

export function saveSave(data: SaveData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage penuh / diblokir — biarkan tanpa crash */
  }
}

export function resetSave() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Bintang penilaian akhir berdasarkan sisa kesehatan masjid (ramah anak: minimal 1). */
export function computeStars(mosqueHp: number, mosqueMaxHp: number): 1 | 2 | 3 {
  const pct = mosqueHp / Math.max(1, mosqueMaxHp)
  if (pct >= 0.85) return 3
  if (pct >= 0.6) return 2
  return 1
}
