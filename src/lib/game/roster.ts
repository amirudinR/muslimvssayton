/* ============================================================
 * PENJAGA MASJID — Roster Karakter Generatif (P4/P6)
 * 100 karakter = 6 kategori power × 4 tier rarity × tema visual.
 * 6 karakter "hero" (Ali, Aisyah, Umar, Fatimah, Misbah, Kakek)
 * adalah versi Legendaris signature — sisanya 94 generatif.
 * Semua deterministik (seeded) supaya konsisten antar sesi.
 * ============================================================ */

import { CHAR_DEFS, type AttackKind } from './data'

/* ------------------------------ Rarity ------------------------------ */

export type Rarity = 'umum' | 'langka' | 'epik' | 'legendaris'

export const RARITY_INFO: Record<Rarity, { label: string; emoji: string; color: string; border: string; glow: string; desc: string }> = {
  umum: { label: 'Umum', emoji: '⚪', color: '#8a8f98', border: '#c4c9d0', glow: '', desc: 'Baju rapi polos — sederhana tapi berkah!' },
  langka: { label: 'Langka', emoji: '🔵', color: '#3f8fd9', border: '#7fb8e8', glow: 'rgba(63,143,217,0.35)', desc: 'Ada 1 aksesoris unik + serangan lebih ramai!' },
  epik: { label: 'Epik', emoji: '🟣', color: '#9a5fd0', border: '#c79ae8', glow: 'rgba(154,95,208,0.4)', desc: 'Outfit detail + elemen bercahaya ✨' },
  legendaris: { label: 'Legendaris', emoji: '🟠', color: '#f59e0b', border: '#ffd76a', glow: 'rgba(245,158,11,0.45)', desc: 'Aura partikel + efek serangan spektakuler! 👑' },
}

/* ------------------------------ Power ------------------------------ */

/** Kategori kekuatan (6 macam — sama dengan hero). */
export type PowerCategory = 'cahaya' | 'dzikir' | 'sedekah' | 'wangi' | 'nasihat' | 'adzan'

export interface PowerInfo {
  id: PowerCategory
  label: string
  emoji: string
  desc: string
  /** attack kind di sistem game */
  attack: AttackKind
  heroId: string
  /** 3 sub-varian strategi */
  variants: { id: string; label: string; desc: string; damageMult: number; rateMult: number; rangeMult: number }[]
}

export const POWERS: PowerInfo[] = [
  {
    id: 'cahaya', label: 'Cahaya', emoji: '✨', attack: 'orb', heroId: 'ali',
    desc: 'Serangan jarak jauh cepat — jarum cahaya sajadah!',
    variants: [
      { id: 'cepat', label: 'Cahaya Cepat', desc: 'Serangan super kilat ⚡', damageMult: 0.85, rateMult: 0.8, rangeMult: 1 },
      { id: 'tembus', label: 'Cahaya Tembus', desc: 'Jangkauan lebih jauh 🎯', damageMult: 1, rateMult: 1, rangeMult: 1.25 },
      { id: 'meledak', label: 'Cahaya Meledak', desc: 'Kena area lebih luas 💥', damageMult: 1.3, rateMult: 1.35, rangeMult: 0.95 },
    ],
  },
  {
    id: 'dzikir', label: 'Dzikir', emoji: '📿', attack: 'bubble', heroId: 'aisyah',
    desc: 'Gelembung dzikir — setan kliyengan & mundur (area).',
    variants: [
      { id: 'cepat', label: 'Dzikir Rapat', desc: 'Letusan lebih sering 🫧', damageMult: 0.85, rateMult: 0.75, rangeMult: 1 },
      { id: 'luas', label: 'Dzikir Luas', desc: 'Area kliyengan lebih besar 🌊', damageMult: 1, rateMult: 1.1, rangeMult: 1.15 },
      { id: 'lembut', label: 'Dzikir Lembut', desc: 'Setan makin lama lambatnya 🐌', damageMult: 1.15, rateMult: 1.2, rangeMult: 1 },
    ],
  },
  {
    id: 'sedekah', label: 'Sedekah', emoji: '🪙', attack: 'coin', heroId: 'umar',
    desc: 'Koin emas — splash damage + dorong mundur (knockback).',
    variants: [
      { id: 'berat', label: 'Sedekah Berat', desc: 'Koin raksasa damage besar 🏋️', damageMult: 1.35, rateMult: 1.3, rangeMult: 1 },
      { id: 'hujan', label: 'Hujan Sedekah', desc: 'Lemparan lebih sering 🌧️', damageMult: 0.8, rateMult: 0.7, rangeMult: 1.05 },
      { id: 'mentul', label: 'Sedekah Mentul', desc: 'Setan terpental lebih jauh 🏓', damageMult: 1, rateMult: 1, rangeMult: 1.2 },
    ],
  },
  {
    id: 'wangi', label: 'Wangi Wudhu', emoji: '💧', attack: 'aura', heroId: 'fatimah',
    desc: 'Aroma wangi — setan jadi lambat & mabuk wangi (debuff).',
    variants: [
      { id: 'pekat', label: 'Wangi Pekat', desc: 'Slow lebih kuat 💦', damageMult: 1.2, rateMult: 1.05, rangeMult: 0.95 },
      { id: 'mewar', label: 'Wangi Mewar', desc: 'Area aroma lebih luas 🌸', damageMult: 1, rateMult: 1.1, rangeMult: 1.3 },
      { id: 'awet', label: 'Wangi Awet', desc: 'Bau wangi lebih lama melekat ⏰', damageMult: 0.9, rateMult: 0.85, rangeMult: 1.05 },
    ],
  },
  {
    id: 'nasihat', label: 'Nasihat', emoji: '💡', attack: 'sedekah', heroId: 'misbah',
    desc: 'Buff teman sekitar / hasilkan pahala (dukungan).',
    variants: [
      { id: 'subur', label: 'Rezeki Subur', desc: 'Pahala otomatis melimpah 💰', damageMult: 1, rateMult: 0.9, rangeMult: 1 },
      { id: 'kilat', label: 'Rezeki Kilat', desc: 'Pahala keluar lebih cepat ⚡', damageMult: 1, rateMult: 0.75, rangeMult: 1 },
      { id: 'berkah', label: 'Rezeki Berkah', desc: 'Jangkauan berkah lebih luas 🌟', damageMult: 1, rateMult: 0.95, rangeMult: 1.4 },
    ],
  },
  {
    id: 'adzan', label: 'Adzan', emoji: '📢', attack: 'adzan', heroId: 'kakek',
    desc: 'ULTIMATE — kena SEMUA setan di layar, dorong & stun.',
    variants: [
      { id: 'lantang', label: 'Adzan Lantang', desc: 'Damage besar 🔊', damageMult: 1.3, rateMult: 1, rangeMult: 1 },
      { id: 'panjang', label: 'Adzan Panjang', desc: 'Durasi stun lebih lama ⏳', damageMult: 1, rateMult: 0.85, rangeMult: 1 },
      { id: 'fajr', label: 'Adzan Fajr', desc: 'Serangan lebih sering 🌅', damageMult: 0.85, rateMult: 0.7, rangeMult: 1 },
    ],
  },
]

/* ------------------------------ Tema visual ------------------------------ */

export interface ThemeDef {
  id: string
  label: string
  /** warna jubah utama */
  robe: number
  /** warna aksen (peci/hijab) */
  accent: number
  emoji: string
}

export const THEMES: ThemeDef[] = [
  { id: 'santri_desa', label: 'Santri Desa', robe: 0x5aa668, accent: 0xf5d76e, emoji: '🌾' },
  { id: 'santri_kota', label: 'Santri Kota', robe: 0x4a90a8, accent: 0xffe9a8, emoji: '🏙️' },
  { id: 'pesantren', label: 'Anak Pesantren', robe: 0x8a6a3f, accent: 0xfff3d6, emoji: '📚' },
  { id: 'yatim_ceria', label: 'Anak Yatim Ceria', robe: 0xd98a5c, accent: 0xf5d76e, emoji: '😊' },
  { id: 'juara_adzan', label: 'Juara Adzan', robe: 0x2ea36a, accent: 0xffd76a, emoji: '🏆' },
  { id: 'penjahit', label: 'Si Penjahit Solehah', robe: 0xc96a9a, accent: 0xfff3c9, emoji: '🧵' },
  { id: 'petani', label: 'Petani Syukur', robe: 0x8a9a4a, accent: 0xe8d9a9, emoji: '🌱' },
  { id: 'pedagang', label: 'Pedagang Jujur', robe: 0xb87a3a, accent: 0xffefc0, emoji: '🛒' },
  { id: 'dokter_cilik', label: 'Dokter Cilik', robe: 0x6ab8c9, accent: 0xffffff, emoji: '🩺' },
  { id: 'imam_muda', label: 'Imam Muda', robe: 0xf0ead6, accent: 0x2ea36a, emoji: '🕌' },
]

/* ------------------------------ Nama generatif ------------------------------ */

const FIRST_NAMES = [
  'Bagus', 'Rizky', 'Fajar', 'Hafiz', 'Naufal', 'Zaki', 'Farhan', 'Ilham', 'Yusuf', 'Ibrahim',
  'Aisyah', 'Zahra', 'Maryam', 'Khadijah', 'Fatimah', 'Alya', 'Nadia', 'Salma', 'Hana', 'Amira',
  'Adib', 'Ammar', 'Bilal', 'Dzaki', 'Eka', 'Fadhil', 'Ghani', 'Hamid', 'Iqbal', 'Jibril',
  'Kalista', 'Latif', 'Munir', 'Nashir', 'Omar', 'Putra', 'Qosim', 'Rayyan', 'Sultan', 'Taufik',
]
const TITLES = [
  'si Rajin Sholat', 'si Pemalu', 'si Ceria', 'si Penolong', 'si Penyabar', 'si Cerdas',
  'si Penyayang', 'si Dermawan', 'si Tawakal', 'si Bersyukur', 'si Ramah', 'si Kuat',
]

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------ Roster 100 ------------------------------ */

export interface RosterChar {
  id: string
  name: string
  /** power kategori */
  power: PowerCategory
  /** sub-varian power */
  variant: string
  /** tema visual */
  theme: string
  themeLabel: string
  rarity: Rarity
  /** hero signature (6 pertama) — model dari CHAR_DEFS */
  heroId?: string
  emoji: string
  robe: number
  accent: number
  skin: number
  /** harga bintang di toko */
  price: number
  /** deskripsi lucu */
  desc: string
  /** gender presentation utk model (netral sopan) */
  presentation: 'anak-laki' | 'anak-perempuan' | 'kakek'
}

export const RARITY_PRICE: Record<Rarity, number> = {
  umum: 15,
  langka: 40,
  epik: 90,
  legendaris: 200,
}

/* Harga hero signature (semua legendaris) */
const HERO_PRICE = 120

/* 6 hero legendaris signature */
const HEROES: RosterChar[] = [
  { id: 'hero-ali', name: CHAR_DEFS.ali.name, power: 'cahaya', variant: 'cepat', theme: 'juara_adzan', themeLabel: 'Juara Adzan', rarity: 'legendaris', heroId: 'ali', emoji: '🤲', robe: 0x2ea36a, accent: 0xf5d76e, skin: 0xffd9b3, price: HERO_PRICE, desc: CHAR_DEFS.ali.desc, presentation: 'anak-laki' },
  { id: 'hero-aisyah', name: CHAR_DEFS.aisyah.name, power: 'dzikir', variant: 'luas', theme: 'santri_kota', themeLabel: 'Santri Kota', rarity: 'legendaris', heroId: 'aisyah', emoji: '📖', robe: 0xe86a92, accent: 0xfff3c9, skin: 0xffe0c2, price: HERO_PRICE, desc: CHAR_DEFS.aisyah.desc, presentation: 'anak-perempuan' },
  { id: 'hero-umar', name: CHAR_DEFS.umar.name, power: 'sedekah', variant: 'berat', theme: 'pedagang', themeLabel: 'Pedagang Jujur', rarity: 'legendaris', heroId: 'umar', emoji: '💝', robe: 0xf5b83d, accent: 0x8a5a2b, skin: 0xf3c69a, price: HERO_PRICE, desc: CHAR_DEFS.umar.desc, presentation: 'anak-laki' },
  { id: 'hero-fatimah', name: CHAR_DEFS.fatimah.name, power: 'wangi', variant: 'mewar', theme: 'penjahit', themeLabel: 'Si Penjahit Solehah', rarity: 'legendaris', heroId: 'fatimah', emoji: '💧', robe: 0x5bc8c0, accent: 0xffe9a8, skin: 0xffdcbb, price: HERO_PRICE, desc: CHAR_DEFS.fatimah.desc, presentation: 'anak-perempuan' },
  { id: 'hero-misbah', name: CHAR_DEFS.misbah.name, power: 'nasihat', variant: 'subur', theme: 'pesantren', themeLabel: 'Anak Pesantren', rarity: 'legendaris', heroId: 'misbah', emoji: '💡', robe: 0x6db3d9, accent: 0xffd76a, skin: 0xffd9b3, price: HERO_PRICE, desc: CHAR_DEFS.misbah.desc, presentation: 'anak-laki' },
  { id: 'hero-kakek', name: CHAR_DEFS.kakek.name, power: 'adzan', variant: 'lantang', theme: 'imam_muda', themeLabel: 'Imam Muda', rarity: 'legendaris', heroId: 'kakek', emoji: '📢', robe: 0xf0ead6, accent: 0x2ea36a, skin: 0xf0c8a0, price: HERO_PRICE, desc: CHAR_DEFS.kakek.desc, presentation: 'kakek' },
]

/* 94 karakter generatif — deterministik */
function buildRoster(): RosterChar[] {
  const list: RosterChar[] = [...HEROES]
  const rand = mulberry(20260906)
  const rarityPlan: Rarity[] = []
  // 94 karakter: 30 umum, 30 langka, 22 epik, 12 legendaris
  for (let i = 0; i < 30; i++) rarityPlan.push('umum')
  for (let i = 0; i < 30; i++) rarityPlan.push('langka')
  for (let i = 0; i < 22; i++) rarityPlan.push('epik')
  for (let i = 0; i < 12; i++) rarityPlan.push('legendaris')
  // shuffle deterministik
  for (let i = rarityPlan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[rarityPlan[i], rarityPlan[j]] = [rarityPlan[j], rarityPlan[i]]
  }

  const nameUsed = new Set<string>()
  for (let i = 0; i < 94; i++) {
    const rarity = rarityPlan[i]
    const power = POWERS[i % POWERS.length]
    const theme = THEMES[Math.floor(rand() * THEMES.length)]
    const variant = power.variants[Math.floor(rand() * power.variants.length)]
    // nama unik
    let name = ''
    let tries = 0
    do {
      const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
      const title = TITLES[Math.floor(rand() * TITLES.length)]
      name = `${first} ${title}`
      tries++
    } while (nameUsed.has(name) && tries < 40)
    nameUsed.add(name)

    const isGirl = /Aisyah|Zahra|Maryam|Khadijah|Fatimah|Alya|Nadia|Salma|Hana|Amira|Kalista/.test(name)
    const presentation: RosterChar['presentation'] = power.id === 'adzan' ? 'kakek' : isGirl ? 'anak-perempuan' : 'anak-laki'
    const skinTones = [0xffd9b3, 0xffe0c2, 0xf3c69a, 0xefc3a0, 0xffdcbb]
    const skin = skinTones[Math.floor(rand() * skinTones.length)]

    // variasi warna jubah per karakter (hue shift kecil dari tema)
    const robe = theme.robe

    const desc = `${theme.label} bertarung dengan ${power.label} — ${power.desc}`

    list.push({
      id: `gen-${i + 1}`,
      name,
      power: power.id,
      variant: variant.id,
      theme: theme.id,
      themeLabel: theme.label,
      rarity,
      emoji: theme.emoji,
      robe,
      accent: theme.accent,
      skin,
      price: RARITY_PRICE[rarity] + Math.floor(rand() * 10) * 2,
      desc,
      presentation,
    })
  }
  return list
}

export const ROSTER: RosterChar[] = buildRoster()

export function getRosterChar(id: string): RosterChar | undefined {
  return ROSTER.find((c) => c.id === id)
}

export function rosterByPower(power: PowerCategory): RosterChar[] {
  return ROSTER.filter((c) => c.power === power)
}

/* ------------------------------ CharCustom (P6) ------------------------------ */

export interface CharCustom {
  /** basis presentasi tubuh */
  presentation: 'anak-laki' | 'anak-perempuan'
  robeColor: number
  accentColor: number
  skinColor: number
  hairColor: number
  /** aksesoris terpilih */
  accessory: 'none' | 'tasbih' | 'tas-kecil' | 'sajadah' | 'buku' | 'lampion'
  /** ekspresi */
  expression: 'ceria' | 'pemalu' | 'semangat'
  power: PowerCategory
  variant: string
}

export const DEFAULT_CUSTOM: CharCustom = {
  presentation: 'anak-laki',
  robeColor: 0x5aa668,
  accentColor: 0xf5d76e,
  skinColor: 0xffd9b3,
  hairColor: 0x3a3550,
  accessory: 'tasbih',
  expression: 'ceria',
  power: 'cahaya',
  variant: 'cepat',
}

export const ROBE_COLORS = [
  0x5aa668, 0x4a90a8, 0xc96a9a, 0xf5b83d, 0x5bc8c0, 0x9a5fd0,
  0xd98a5c, 0xe86a92, 0x6db3d9, 0x8a9a4a, 0xf0ead6, 0xb87a3a,
]
export const ACCENT_COLORS = [0xf5d76e, 0xfff3c9, 0xffd1e0, 0xa8e6ff, 0xffe9a8, 0xd9a25f]
export const SKIN_COLORS = [0xffd9b3, 0xffe0c2, 0xf3c69a, 0xefc3a0, 0xffdcbb, 0xe8b890]
export const HAIR_COLORS = [0x3a3550, 0x4a3b52, 0x2c2620, 0x6a5a4a, 0x8a7a6a, 0x1a1a2a]

export const ACCESSORY_INFO: Record<CharCustom['accessory'], { label: string; emoji: string }> = {
  none: { label: 'Tanpa Aksesoris', emoji: '⬜' },
  tasbih: { label: 'Tasbih', emoji: '📿' },
  'tas-kecil': { label: 'Tas Kecil', emoji: '🎒' },
  sajadah: { label: 'Sajadah Mini', emoji: '🧎' },
  buku: { label: 'Buku Doa', emoji: '📖' },
  lampion: { label: 'Lampion', emoji: '🏮' },
}

export const EXPRESSION_INFO: Record<CharCustom['expression'], { label: string; emoji: string }> = {
  ceria: { label: 'Ceria', emoji: '😄' },
  pemalu: { label: 'Pemalu', emoji: '☺️' },
  semangat: { label: 'Semangat', emoji: '😤' },
}
