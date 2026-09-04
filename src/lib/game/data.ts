/* ============================================================
 * PENJAGA MASJID — Data & Definitions
 * Karakter anak sholeh (tower), setan jahil versi lucu (enemy),
 * wave, jalur (lane), slot penempatan, dan tips edukatif.
 * ============================================================ */

export type CharId = 'ali' | 'aisyah' | 'umar' | 'fatimah' | 'misbah' | 'kakek'

/** P5: 20 jenis hantu lokal Indonesia (semua versi chibi lucu). */
export type EnemyId =
  | 'pocong' | 'kunti' | 'genderuwo' | 'tuyul' | 'wewe' | 'kuyang' | 'banaspati'
  // 13 tambahan (P5):
  | 'sundel' | 'leak' | 'kolongwewe' | 'jailangkung' | 'bunian' | 'butoijo'
  | 'nyiblorong' | 'palasik' | 'suster' | 'cindaku' | 'gendruwo' | 'wewerawa' | 'kober'

export type AttackKind = 'orb' | 'bubble' | 'coin' | 'aura' | 'adzan' | 'sedekah'

export interface CharLevelStats {
  damage: number
  fireRate: number // detik antar serangan
  range: number
}

export interface CharDef {
  id: CharId
  name: string
  shortName: string
  role: string
  desc: string
  funFact: string
  emoji: string
  color: number // warna jubah utama
  accent: number // warna aksen (peci/hijab/ atribut)
  skin: number
  cost: number
  upgradeCosts: [number, number]
  attack: AttackKind
  unlockWave: number
  levels: [CharLevelStats, CharLevelStats, CharLevelStats]
  aoeRadius?: number[] // per level
  slowFactor?: number[] // 0..1 multiplier kecepatan musuh
  slowDuration?: number[]
  knockback?: number
  stunDuration?: number
  /** Misbah: [jumlahPahala, intervalDetik] per level — kotak sedekah pasif */
  pahalaGen?: [number, number][]
}

export interface EnemyDef {
  id: EnemyId
  name: string
  emoji: string
  desc: string
  hp: number
  speed: number
  damage: number // kerusakan ke masjid saat lolos
  reward: number // pahala saat dihalau
  scale: number
  steals?: number // tuyul: mencuri pahala saat lolos
  buff?: { radius: number; speedMult: number; duration: number; interval: number }
  knockResist?: number // 0..1
  fleesOnHit?: boolean
  isBoss?: boolean
  flying?: boolean // melayang — tinggi & kebal slow
  slowImmune?: boolean
}

export interface WaveSpawn {
  type: EnemyId
  count: number
  interval: number // detik antar spawn
  delay?: number // jeda awal sekelompok spawn
}

export interface WaveDef {
  spawns: WaveSpawn[]
  reward: number
  isBoss?: boolean
}

/* ------------------------- KARAKTER ANAK SHOLEH ------------------------- */

export const CHAR_DEFS: Record<CharId, CharDef> = {
  ali: {
    id: 'ali',
    name: 'Ali si Rajin Sholat',
    shortName: 'Ali',
    role: 'Cahaya Sajadah',
    desc: 'Melempar cahaya sajadah bersinar ke setan. Cepat dan rajin!',
    funFact: 'Ali tidak pernah bolong sholat 5 waktu. Karena itu hatinya selalu cerah ✨',
    emoji: '🤲',
    color: 0x2ea36a, // hijau jubah
    accent: 0xf5d76e,
    skin: 0xffd9b3,
    cost: 50,
    upgradeCosts: [45, 90],
    attack: 'orb',
    unlockWave: 1,
    levels: [
      { damage: 9, fireRate: 0.9, range: 9 },
      { damage: 14, fireRate: 0.75, range: 10 },
      { damage: 20, fireRate: 0.6, range: 11 },
    ],
  },
  aisyah: {
    id: 'aisyah',
    name: 'Aisyah si Penghafal Doa',
    shortName: 'Aisyah',
    role: 'Gelembung Dzikir',
    desc: 'Gelembung dzikir bikin setan kliyengan dan mundur (kena area).',
    funFact: 'Aisyah hafal doa harian. Kalau berdoa, hatinya jadi tenang dan percaya diri 🌸',
    emoji: '📖',
    color: 0xe86a92, // pink jubah
    accent: 0xfff3c9,
    skin: 0xffe0c2,
    cost: 70,
    upgradeCosts: [60, 110],
    attack: 'bubble',
    unlockWave: 1,
    levels: [
      { damage: 10, fireRate: 2.2, range: 8 },
      { damage: 15, fireRate: 1.9, range: 9 },
      { damage: 22, fireRate: 1.6, range: 9.5 },
    ],
    aoeRadius: [2.8, 3.2, 3.8],
    slowDuration: [1.2, 1.4, 1.6],
  },
  umar: {
    id: 'umar',
    name: 'Umar si Kuat Sedekah',
    shortName: 'Umar',
    role: 'Koin Emas Sedekah',
    desc: 'Lempar koin emas! Setan kaget dan terpental (splash + dorong mundur).',
    funFact: 'Umar selalu menyisihkan uang saku untuk sedekah. Sedekah itu menolak bala! 🪙',
    emoji: '💝',
    color: 0xf5b83d, // kuning-oranye jubah
    accent: 0x8a5a2b,
    skin: 0xf3c69a,
    cost: 90,
    upgradeCosts: [80, 140],
    attack: 'coin',
    unlockWave: 2,
    levels: [
      { damage: 22, fireRate: 2.6, range: 10 },
      { damage: 32, fireRate: 2.2, range: 11 },
      { damage: 45, fireRate: 1.8, range: 12 },
    ],
    aoeRadius: [2.4, 2.8, 3.4],
    knockback: 1.4,
  },
  fatimah: {
    id: 'fatimah',
    name: 'Fatimah si Wangi Wudhu',
    shortName: 'Fatimah',
    role: 'Aroma Wangi Wudhu',
    desc: 'Semburan wangi wudhu bikin setan lambat dan mabuk kebangaan wangi.',
    funFact: 'Fatimah selalu berwudhu sebelum bermain. Badannya segar dan wanginya memikat 🌷',
    emoji: '💧',
    color: 0x5bc8c0, // teal jubah
    accent: 0xffe9a8,
    skin: 0xffdcbb,
    cost: 60,
    upgradeCosts: [50, 95],
    attack: 'aura',
    unlockWave: 3,
    levels: [
      { damage: 3, fireRate: 2.0, range: 7 },
      { damage: 5, fireRate: 1.7, range: 8 },
      { damage: 8, fireRate: 1.4, range: 8.5 },
    ],
    slowFactor: [0.45, 0.4, 0.35],
    slowDuration: [2.5, 3.0, 3.5],
  },
  kakek: {
    id: 'kakek',
    name: 'Kakek Imam Bijak',
    shortName: 'Kakek Imam',
    role: 'Cahaya Adzan',
    desc: 'ULTIMATE! Cahaya adzan bikin SEMUA setan di layar kaget & mundur jauh.',
    funFact: 'Kakek Imam selalu mengajak anak-anak ke masjid dengan suara lembut 🕌',
    emoji: '📢',
    color: 0xf0ead6, // jubah putih krem
    accent: 0x2ea36a,
    skin: 0xf0c8a0,
    cost: 220,
    upgradeCosts: [180, 300],
    attack: 'adzan',
    unlockWave: 5,
    levels: [
      { damage: 16, fireRate: 8, range: 99 },
      { damage: 24, fireRate: 6.5, range: 99 },
      { damage: 34, fireRate: 5, range: 99 },
    ],
    knockback: 2.6,
    stunDuration: 1.5,
  },
  misbah: {
    id: 'misbah',
    name: 'Misbah si Muadzin Muda',
    shortName: 'Misbah',
    role: 'Kotak Sedekah',
    desc: 'Tidak suka bertarung — kotak sedekahnya menghasilkan pahala otomatis! Pasang dini, untung besar 💰',
    funFact: 'Misbah menyalakan lampu masjid tiap maghrib. Katanya: "Sedekah itu investasi akhirat!" 💡',
    emoji: '💡',
    color: 0x6db3d9, // biru jubah lembut
    accent: 0xffd76a,
    skin: 0xffd9b3,
    cost: 80,
    upgradeCosts: [70, 120],
    attack: 'sedekah',
    unlockWave: 4,
    levels: [
      { damage: 0, fireRate: 6, range: 2 },
      { damage: 0, fireRate: 5, range: 2 },
      { damage: 0, fireRate: 4, range: 2 },
    ],
    pahalaGen: [
      [5, 6],
      [8, 5],
      [12, 4],
    ],
  },
}

export const CHAR_ORDER: CharId[] = ['ali', 'aisyah', 'umar', 'fatimah', 'misbah', 'kakek']

/* --------------------------- SETAN JAHIL LUCU --------------------------- */

export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  pocong: {
    id: 'pocong',
    name: 'Pocong Lucu',
    emoji: '👻',
    desc: 'Jalan loncat-loncat mengantuk. Cepat tapi ringkih.',
    hp: 22,
    speed: 2.3,
    damage: 3,
    reward: 8,
    scale: 1,
  },
  kunti: {
    id: 'kunti',
    name: 'Kunti Cilik',
    emoji: '🎀',
    desc: 'Ketawa cekikikan lalu bikin teman-temannya semangat (buff).',
    hp: 32,
    speed: 1.8,
    damage: 5,
    reward: 12,
    scale: 1,
    buff: { radius: 4.5, speedMult: 1.35, duration: 2.5, interval: 4 },
  },
  genderuwo: {
    id: 'genderuwo',
    name: 'Genderuwo Kecil',
    emoji: '🧸',
    desc: 'Gempal berbulu lembut kayak boneka. Jalan santai, badan tebal.',
    hp: 95,
    speed: 1.05,
    damage: 10,
    reward: 20,
    scale: 1.25,
    knockResist: 0.7,
  },
  tuyul: {
    id: 'tuyul',
    name: 'Tuyul Usil',
    emoji: '🪙',
    desc: 'Gesit & usil — kalau lolos, dia mencuri pahalamu!',
    hp: 14,
    speed: 3.4,
    damage: 2,
    reward: 10,
    scale: 0.75,
    steals: 8,
  },
  wewe: {
    id: 'wewe',
    name: 'Wewe Gombel Baik Hati',
    emoji: '👵',
    desc: 'Pura-pura mau menculik, padahal malu-malu. Kena serang langsung kabur!',
    hp: 42,
    speed: 1.6,
    damage: 6,
    reward: 14,
    scale: 1.1,
    fleesOnHit: true,
  },
  kuyang: {
    id: 'kuyang',
    name: 'Kuyang Melayang Lucu',
    emoji: '🎈',
    desc: 'Kepala terbang penuh rasa penasaran. Melayang tinggi — wangi wudhu tak tersentuh!',
    hp: 24,
    speed: 2.15,
    damage: 4,
    reward: 12,
    scale: 0.9,
    flying: true,
    slowImmune: true,
  },
  banaspati: {
    id: 'banaspati',
    name: 'Banaspati Ngambek',
    emoji: '🔥',
    desc: 'BOSS bola api gembul yang lagi ngambek. Asap ungu kalau kesal!',
    hp: 650,
    speed: 0.95,
    damage: 25,
    reward: 120,
    scale: 1.9,
    knockResist: 0.9,
    isBoss: true,
  },

  /* ---------- P5: 13 hantu baru, semua versi menggemaskan ---------- */
  sundel: {
    id: 'sundel',
    name: 'Sundel Bolong Comel',
    emoji: '🎀',
    desc: 'Terbang melayang pelan dengan pita pink di punggung. Angin bawa-bawa bau wangi!',
    hp: 38,
    speed: 1.75,
    damage: 6,
    reward: 16,
    scale: 1.05,
    flying: true,
  },
  leak: {
    id: 'leak',
    name: 'Leak Mini',
    emoji: '🦋',
    desc: 'Kepala terbang kecil dari Bali dengan ekor pita warna-warni — melayang zig-zag!',
    hp: 26,
    speed: 2.3,
    damage: 4,
    reward: 14,
    scale: 0.85,
    flying: true,
    slowImmune: true,
  },
  kolongwewe: {
    id: 'kolongwewe',
    name: 'Kolong Wewe Penggemas',
    emoji: '🙈',
    desc: 'Suka sembunyi di kolong meja — jalannya jongkok lucu, suka ngintip-ngintip.',
    hp: 48,
    speed: 1.35,
    damage: 7,
    reward: 15,
    scale: 1,
    knockResist: 0.4,
  },
  jailangkung: {
    id: 'jailangkung',
    name: 'Jailangkung Jenaka',
    emoji: '🪆',
    desc: 'Boneka kayu yang gerakannya patah-patah — suka menari aneh sambil jalan!',
    hp: 30,
    speed: 1.9,
    damage: 5,
    reward: 13,
    scale: 1,
  },
  bunian: {
    id: 'bunian',
    name: 'Orang Bunian Pemalu',
    emoji: '🍃',
    desc: 'Makhluk hutan bertopi daun — kalau dilihat langsung, dia malu-malu ngebut!',
    hp: 20,
    speed: 2.6,
    damage: 3,
    reward: 11,
    scale: 0.9,
    fleesOnHit: true,
  },
  butoijo: {
    id: 'butoijo',
    name: 'Buto Ijo Mini',
    emoji: '💚',
    desc: 'Raksasa hijau versi gembul — ekspresi polos bingung, badannya tebal!',
    hp: 130,
    speed: 0.9,
    damage: 13,
    reward: 26,
    scale: 1.4,
    knockResist: 0.75,
  },
  nyiblorong: {
    id: 'nyiblorong',
    name: 'Nyi Blorong Comel',
    emoji: '🐍',
    desc: 'Setengah putri setengah ular kecil emas-hijau — geraknya meliuk-meliuk lucu.',
    hp: 55,
    speed: 1.55,
    damage: 8,
    reward: 18,
    scale: 1.1,
  },
  palasik: {
    id: 'palasik',
    name: 'Palasik Kecil',
    emoji: '🐱',
    desc: 'Melayang ringan dengan wajah kucing-kucingan — iseng suka pura-pung kucing!',
    hp: 28,
    speed: 2.05,
    damage: 4,
    reward: 13,
    scale: 0.9,
    flying: true,
  },
  suster: {
    id: 'suster',
    name: 'Suster Ngesot Ceria',
    emoji: '👩‍⚕️',
    desc: 'Ngesot ala breakdance lucu — geser mundur cepat di lantai!',
    hp: 34,
    speed: 1.85,
    damage: 5,
    reward: 14,
    scale: 1,
  },
  cindaku: {
    id: 'cindaku',
    name: 'Cindaku Comel',
    emoji: '🐯',
    desc: 'Anak harimau berjalan dua kaki — malu-malu tapi gesit!',
    hp: 42,
    speed: 2.0,
    damage: 6,
    reward: 15,
    scale: 1,
  },
  gendruwo: {
    id: 'gendruwo',
    name: 'Gendruwo Bukit',
    emoji: '🌼',
    desc: 'Genderuwo varian gunung — badannya ditumbuhi lumut & bunga kecil. Ramah lingkungan!',
    hp: 105,
    speed: 0.98,
    damage: 11,
    reward: 22,
    scale: 1.3,
    knockResist: 0.7,
  },
  wewerawa: {
    id: 'wewerawa',
    name: 'Wewe Rawa',
    emoji: '🪷',
    desc: 'Wewe rawa-rawa bawa payung daun teratai — jalan santai gemoy.',
    hp: 60,
    speed: 1.2,
    damage: 9,
    reward: 18,
    scale: 1.15,
    knockResist: 0.5,
  },
  kober: {
    id: 'kober',
    name: 'Setan Kober Jahil',
    emoji: '😈',
    desc: 'Sembunyi di balik pohon sambil usil — kalau kena serang langsung kabur terbirit!',
    hp: 24,
    speed: 2.2,
    damage: 4,
    reward: 12,
    scale: 0.95,
    fleesOnHit: true,
  },
}

/* ------------------------------- WAVE (10) ------------------------------- */

export const WAVES: WaveDef[] = [
  { spawns: [{ type: 'pocong', count: 6, interval: 1.6 }], reward: 24 },
  { spawns: [{ type: 'pocong', count: 8, interval: 1.4 }, { type: 'tuyul', count: 2, interval: 2.5, delay: 5 }], reward: 30 },
  { spawns: [{ type: 'pocong', count: 6, interval: 1.2 }, { type: 'kunti', count: 4, interval: 2.2, delay: 2 }], reward: 36 },
  { spawns: [{ type: 'genderuwo', count: 2, interval: 3 }, { type: 'pocong', count: 8, interval: 1.1, delay: 2 }, { type: 'tuyul', count: 3, interval: 2, delay: 8 }], reward: 42 },
  { spawns: [{ type: 'kunti', count: 5, interval: 1.8 }, { type: 'genderuwo', count: 3, interval: 2.6, delay: 3 }], reward: 50 },
  { spawns: [
    { type: 'wewe', count: 5, interval: 2 },
    { type: 'sundel', count: 3, interval: 2.2, delay: 3 },
    { type: 'tuyul', count: 4, interval: 1.5, delay: 3 },
    { type: 'pocong', count: 6, interval: 0.9, delay: 5 },
  ], reward: 60 },
  { spawns: [
    { type: 'genderuwo', count: 4, interval: 2 },
    { type: 'kunti', count: 4, interval: 1.6, delay: 2 },
    { type: 'kuyang', count: 3, interval: 2, delay: 6 },
    { type: 'leak', count: 3, interval: 2.2, delay: 8 },
    { type: 'pocong', count: 5, interval: 0.8, delay: 6 },
  ], reward: 70 },
  { spawns: [
    { type: 'suster', count: 4, interval: 1.8 },
    { type: 'jailangkung', count: 4, interval: 2, delay: 2 },
    { type: 'gendruwo', count: 3, interval: 2.4, delay: 3 },
    { type: 'kuyang', count: 3, interval: 1.8, delay: 5 },
    { type: 'kolongwewe', count: 3, interval: 2.2, delay: 7 },
    { type: 'tuyul', count: 4, interval: 1, delay: 6 },
  ], reward: 78 },
  { spawns: [
    { type: 'butoijo', count: 2, interval: 3 },
    { type: 'nyiblorong', count: 4, interval: 1.8, delay: 2 },
    { type: 'cindaku', count: 4, interval: 1.6, delay: 3 },
    { type: 'wewerawa', count: 3, interval: 2.4, delay: 5 },
    { type: 'kuyang', count: 3, interval: 1.6, delay: 7 },
    { type: 'sundel', count: 3, interval: 2, delay: 8 },
    { type: 'tuyul', count: 4, interval: 0.9, delay: 9 },
  ], reward: 88 },
  {
    spawns: [
      { type: 'banaspati', count: 1, interval: 3, delay: 2 },
      { type: 'pocong', count: 8, interval: 0.8, delay: 5 },
      { type: 'kunti', count: 5, interval: 1.4, delay: 9 },
      { type: 'butoijo', count: 2, interval: 3.2, delay: 10 },
      { type: 'palasik', count: 4, interval: 1.6, delay: 12 },
      { type: 'bunian', count: 4, interval: 1.4, delay: 13 },
      { type: 'kober', count: 5, interval: 1.2, delay: 15 },
    ],
    reward: 150,
    isBoss: true,
  },
]

export const HP_WAVE_SCALE = (wave: number) => 1 + 0.12 * (wave - 1)

/* ------------------------------- JALUR LANE ------------------------------- */

export type Lane = [number, number][]

export const LANES: Lane[] = [
  // Barat
  [
    [-36, -8],
    [-26, -8],
    [-26, 4],
    [-16, 4],
    [-16, -2],
    [-10, -2],
  ],
  // Utara
  [
    [0, -22],
    [0, -14],
    [9, -14],
    [9, -9],
    [2, -9],
  ],
  // Timur
  [
    [36, 8],
    [26, 8],
    [26, -2],
    [16, -2],
    [16, 5],
    [9, 5],
  ],
]

export const BOSS_LANE = 1

/* ----------------------------- SLOT TOWER ----------------------------- */

export interface Slot {
  x: number
  z: number
}

export const SLOTS: Slot[] = [
  // Barat
  { x: -30, z: -5 },
  { x: -23, z: -3 },
  { x: -21, z: 7 },
  { x: -13, z: 1 },
  { x: -13, z: -5 },
  // Utara
  { x: -3, z: -18 },
  { x: 3, z: -11 },
  { x: 6, z: -17 },
  { x: 12, z: -11 },
  { x: 13, z: -6 },
  // Timur
  { x: 30, z: 5 },
  { x: 23, z: 2 },
  { x: 29, z: -5 },
  { x: 13, z: -5.5 },
  { x: 19, z: 2 },
  { x: 12, z: 8 },
  // Selatan (halaman masjid)
  { x: -11, z: 9 },
  { x: 0, z: 10.5 },
  { x: 11, z: 9 },
]

/* ------------------------------ TIPS EDUKATIF ------------------------------ */

export const TIPS: string[] = [
  'Sedekah itu menolak bala, lho! 💝',
  'Yuk rajin sholat 5 waktu! 🕌',
  "Membaca Al-Qur'an bikin hati tenang 💚",
  'Berdoa sebelum bermain itu baik ✨',
  'Berwudhu bikin kita segar dan wangi 🌸',
  'Sayangi dan hormati orang tua kita 🤗',
  'Menolong teman itu perbuatan mulia 🤝',
  'Makan makanan halal dan bergizi 🍎',
  'Dzikir bikin hati jadi tenang 😊',
]

/* ------------------------------ KONSTANTA GAME ------------------------------ */

export const GAME_CONST = {
  startPahala: 180,
  mosqueMaxHp: 120,
  firstWaveDelay: 25, // detik sebelum wave 1
  betweenWaveDelay: 16,
  maxEnemies: 40,
  sellRefund: 0.6, // fraksi dari total biaya
} as const

/* --------------------------- Kekuatan DOA BERSAMA --------------------------- */
export const DUA_CONST = {
  /** energi doa maksimum (terisi dengan menghalau setan) */
  max: 100,
  /** energi per setan dihalau */
  perKill: 8,
  /** energi bonus saat gelombang selesai */
  perWave: 14,
  /** durasi berkah (detik) */
  duration: 12,
  /** pengali damage tower saat berkah aktif */
  damageMult: 1.6,
  /** pengali kecepatan serang tower (lebih kecil = lebih cepat) */
  rateMult: 0.65,
  /** setan jadi lambat karena kaget khusyuk */
  enemySlow: 0.55,
  /** masjid dipulihkan sedikit — rezeki doa */
  heal: 8,
} as const

/* --------------------------- TANTANGAN HARIAN --------------------------- */

/** Modifier harian — ditentukan dari tanggal (semua pemain dapat sama). */
export interface DailyModifier {
  id: string
  name: string
  emoji: string
  desc: string
  /** chip efek singkat untuk UI */
  effects: string[]
  enemyHpMult?: number
  enemySpeedMult?: number
  rewardMult?: number
  startPahalaBonus?: number
  mosqueHpBonus?: number
  duaChargeMult?: number
  stealMult?: number
}

export const DAILY_MODIFIERS: DailyModifier[] = [
  {
    id: 'jumat_berkah',
    name: 'Jumat Berkah',
    emoji: '🌟',
    desc: 'Hari berkah! Setan-setan "ketiban berkah" — hadiah pahala lebih melimpah!',
    effects: ['Hadiah pahala +30% 🪙'],
    rewardMult: 1.3,
  },
  {
    id: 'angin_kencang',
    name: 'Angin Kencang',
    emoji: '💨',
    desc: 'Angin bertiup kencang di halaman masjid — setan lari lebih gesit hari ini!',
    effects: ['Setan +15% gesit 💨', 'Hadiah pahala +10% 🪙'],
    enemySpeedMult: 1.15,
    rewardMult: 1.1,
  },
  {
    id: 'masjid_kokoh',
    name: 'Masjid Kokoh',
    emoji: '💪',
    desc: 'Masjid direnovasi lebih kuat hari ini. Tenang, fondasinya tebal!',
    effects: ['HP masjid +40 💪'],
    mosqueHpBonus: 40,
  },
  {
    id: 'gerhana_ceria',
    name: 'Gerhana Ceria',
    emoji: '🌙',
    desc: 'Gerhana membuat setan lebih bersemangat — tapi hadiahnya juga melimpah!',
    effects: ['Setan +20% kuat 😤', 'Hadiah pahala +25% 🪙'],
    enemyHpMult: 1.2,
    rewardMult: 1.25,
  },
  {
    id: 'rezeki_subur',
    name: 'Rezeki Subur',
    emoji: '🪙',
    desc: 'Rezeki subur! Modal awal lebih besar — bangun regu anak sholeh yang besar!',
    effects: ['Modal awal +80 🪙'],
    startPahalaBonus: 80,
  },
  {
    id: 'bulan_purnama',
    name: 'Bulan Purnama',
    emoji: '✨',
    desc: 'Cahaya purnama membuat doa cepat terkabul — energi DOA terisi kilat!',
    effects: ['Energi DOA 2× lebih cepat ⚡'],
    duaChargeMult: 2,
  },
  {
    id: 'tuyul_pesta',
    name: 'Tuyul Pesta',
    emoji: '😅',
    desc: 'Tuyul-tuyul ulang tahun! Mereka kalau lolos mencuri lebih banyak pahala…',
    effects: ['Curian Tuyul 2× 😅', 'Hadiah pahala +15% 🪙'],
    stealMult: 2,
    rewardMult: 1.15,
  },
  {
    id: 'pagi_cerah',
    name: 'Pagi Cerah',
    emoji: '☀️',
    desc: 'Pagi yang cerah membuat setan males jalan — sambil rebahan-santai!',
    effects: ['Setan -10% gesit 🐢', 'Modal awal +40 🪙'],
    enemySpeedMult: 0.9,
    startPahalaBonus: 40,
  },
]

/** kunci tanggal lokal "YYYY-MM-DD" */
export function dailyKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** modifier hari ini — deterministik dari tanggal (semua orang sama) */
export function pickDailyModifier(key = dailyKey()): DailyModifier {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return DAILY_MODIFIERS[h % DAILY_MODIFIERS.length]
}

/* --------------------- Modifier runtime per pertandingan --------------------- */

export interface RunMods {
  enemyHpMult: number
  enemySpeedMult: number
  rewardMult: number
  stealMult: number
  duaChargeMult: number
}

/** modifier aktif untuk pertandingan berjalan (diubah saat mulai game). */
export const RUN_MODS: RunMods = {
  enemyHpMult: 1,
  enemySpeedMult: 1,
  rewardMult: 1,
  stealMult: 1,
  duaChargeMult: 1,
}

export function resetRunMods() {
  RUN_MODS.enemyHpMult = 1
  RUN_MODS.enemySpeedMult = 1
  RUN_MODS.rewardMult = 1
  RUN_MODS.stealMult = 1
  RUN_MODS.duaChargeMult = 1
}

export function applyDailyMods(mod: DailyModifier) {
  resetRunMods()
  if (mod.enemyHpMult) RUN_MODS.enemyHpMult = mod.enemyHpMult
  if (mod.enemySpeedMult) RUN_MODS.enemySpeedMult = mod.enemySpeedMult
  if (mod.rewardMult) RUN_MODS.rewardMult = mod.rewardMult
  if (mod.stealMult) RUN_MODS.stealMult = mod.stealMult
  if (mod.duaChargeMult) RUN_MODS.duaChargeMult = mod.duaChargeMult
}

export const QUALITY_LEVELS = ['low', 'medium', 'high'] as const
export type Quality = (typeof QUALITY_LEVELS)[number]
