/* ============================================================
 * PENJAGA MASJID — Levels (P3: Level Select)
 * Peta petualangan bertema taman/kampung islami.
 * Tiap level = konfigurasi wave & tujuan berbeda, dengan
 * rating bintang 1-3 tersimpan per-level.
 * ============================================================ */

import { WAVES } from './data'

export interface LevelDef {
  id: number
  name: string
  /** lokasi node di peta (persentase 0..100) */
  mapX: number
  mapY: number
  /** jumlah gelombang dari WAVES yang dipakai level ini */
  waves: number
  emoji: string
  desc: string
  /** pahala awal berbeda (makin akhir makin menantang) */
  startPahala: number
  mosqueHp: number
}

/* 8 level bertema taman/kampung islami — node peta petualangan */
export const LEVELS: LevelDef[] = [
  {
    id: 1, name: 'Taman Masjid Raya', mapX: 12, mapY: 78, waves: 3, emoji: '🕌',
    desc: 'Pengenalan: halau pocong mengantuk di taman masjid!',
    startPahala: 220, mosqueHp: 130,
  },
  {
    id: 2, name: 'Kampung Santri Ceria', mapX: 26, mapY: 62, waves: 4, emoji: '🏘️',
    desc: 'Tuyul usil mulai nyolong pahala! Hati-hati ya.',
    startPahala: 200, mosqueHp: 125,
  },
  {
    id: 3, name: 'Kebun Kurma Berbuah', mapX: 40, mapY: 70, waves: 5, emoji: '🌴',
    desc: 'Kunti cekikikan bikin temannya semangat. Siap-siap!',
    startPahala: 190, mosqueHp: 120,
  },
  {
    id: 4, name: 'Kolam Wudhu Penuh Berkah', mapX: 50, mapY: 52, waves: 6, emoji: '💧',
    desc: 'Genderuwo gempal datang santai tapi kuat!',
    startPahala: 185, mosqueHp: 120,
  },
  {
    id: 5, name: 'Pasar Bunga Subuh', mapX: 62, mapY: 62, waves: 7, emoji: '🌸',
    desc: 'Wewe Gombel pura-pura galak. Sebenarnya baik hati!',
    startPahala: 180, mosqueHp: 115,
  },
  {
    id: 6, name: 'Puncak Menara Adzan', mapX: 72, mapY: 42, waves: 8, emoji: '🗼',
    desc: 'Kuyang melayang! Wangi wudhu tak mempan — pakai cahaya!',
    startPahala: 180, mosqueHp: 115,
  },
  {
    id: 7, name: 'Hutan Bambu Damai', mapX: 80, mapY: 26, waves: 9, emoji: '🎋',
    desc: 'Semua setan kerja sama. Pasang penjaga di tiga jalur!',
    startPahala: 175, mosqueHp: 110,
  },
  {
    id: 8, name: 'Kubah Emas Terakhir', mapX: 88, mapY: 12, waves: 10, emoji: '👑',
    desc: 'BANASPATI NGAMBEK datang! Pertempuran besar terakhir!',
    startPahala: 175, mosqueHp: 110,
  },
]

/** total bintang maksimum */
export const MAX_STARS = LEVELS.length * 3

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}

/** wave definitions untuk level tertentu (potongan WAVES) */
export function levelWaves(levelId: number): typeof WAVES {
  const lvl = getLevel(levelId)
  if (!lvl) return WAVES
  return WAVES.slice(0, lvl.waves)
}

/** level terbuka jika level sebelumnya sudah dimenangkan (atau level 1) */
export function isLevelUnlocked(levelId: number, bestLevelDone: number): boolean {
  return levelId <= bestLevelDone + 1
}
