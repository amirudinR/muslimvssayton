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
  /** P9: pekan berturut-turut menang Tantangan Mingguan */
  weeklyStreak: number
  /** P9: kunci pekan (YYYY-Www) terakhir menang tantangan mingguan */
  lastWeeklyWin: string | null
  /** P3: rating bintang terbaik per level (index = levelId-1, nilai 0..3) */
  levelStars: number[]
  /** P3: level tertinggi yang sudah selesai (0 = belum ada) */
  bestLevelDone: number
  /** P4: karakter yang dibeli di toko (id generatif) */
  ownedChars: string[]
  /** P4: bintang currency untuk belanja di toko */
  starCurrency: number
  /** P9-b: statistik pemakaian per karakter (key = id gameplay) */
  charUsage: Record<string, { placed: number; wins: number }>
  /** P11: gelombang terjauh Mode Tak Berujung (0 = belum pernah) */
  bestEndlessWave: number
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
  weeklyStreak: 0,
  lastWeeklyWin: null,
  levelStars: [],
  bestLevelDone: 0,
  ownedChars: [],
  starCurrency: 0,
  charUsage: {},
  bestEndlessWave: 0,
}

/** P9-b: sanitasi charUsage dari save lama — entri rusak dilewati. */
function sanitizeCharUsage(raw: unknown): Record<string, { placed: number; wins: number }> {
  const out: Record<string, { placed: number; wins: number }> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== 'object') continue
    const v = val as { placed?: unknown; wins?: unknown }
    if (typeof v.placed !== 'number' || typeof v.wins !== 'number') continue
    out[id] = { placed: Math.max(0, v.placed | 0), wins: Math.max(0, v.wins | 0) }
  }
  return out
}

export function loadSave(): SaveData {
  if (typeof window === 'undefined') return { ...DEFAULT_SAVE, charUsage: {} }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SAVE, achievements: [], charUsage: {} }
    const parsed = JSON.parse(raw) as Partial<SaveData>
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      tutorialSeen: !!parsed.tutorialSeen,
      lossStreak: typeof parsed.lossStreak === 'number' ? parsed.lossStreak : 0,
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      lastDailyWin: typeof parsed.lastDailyWin === 'string' ? parsed.lastDailyWin : null,
      weeklyStreak: typeof parsed.weeklyStreak === 'number' ? parsed.weeklyStreak : 0,
      lastWeeklyWin: typeof parsed.lastWeeklyWin === 'string' ? parsed.lastWeeklyWin : null,
      levelStars: Array.isArray(parsed.levelStars) ? parsed.levelStars.map((n) => Math.max(0, Math.min(3, n | 0))) : [],
      bestLevelDone: typeof parsed.bestLevelDone === 'number' ? parsed.bestLevelDone : 0,
      ownedChars: Array.isArray(parsed.ownedChars) ? parsed.ownedChars : [],
      starCurrency: typeof parsed.starCurrency === 'number' ? Math.max(0, Math.round(parsed.starCurrency)) : 0,
      charUsage: sanitizeCharUsage(parsed.charUsage),
      bestEndlessWave: typeof parsed.bestEndlessWave === 'number' ? Math.max(0, parsed.bestEndlessWave | 0) : 0,
    }
  } catch {
    return { ...DEFAULT_SAVE, achievements: [], charUsage: {} }
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
