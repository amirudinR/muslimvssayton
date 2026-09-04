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
