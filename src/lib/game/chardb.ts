/* ============================================================
 * PENJAGA MASJID — Gameplay Char Database (P7)
 * Resolver id karakter → CharDef yang dipakai gameplay.
 * Mendukung: 6 hero (CHAR_DEFS) + 94 roster generatif +
 * karakter custom buatan pemain. Statistik roster disintesis
 * dari power/variant/rarity — TETAP SEIMBANG (balanced).
 * ============================================================ */

import { CHAR_DEFS, type CharDef, type CharId, type CharLevelStats } from './data'
import { POWERS, getRosterChar, getCustomConfig, type Rarity, type RosterChar } from './roster'

/** multiplier kekuatan per rarity — legendaris sedikit lebih kuat tapi mahal. */
const RARITY_POWER: Record<Rarity, number> = { umum: 0.92, langka: 1, epik: 1.08, legendaris: 1.15 }
/** biaya pasang (pahala) per rarity. */
const RARITY_COST: Record<Rarity, number> = { umum: 45, langka: 70, epik: 95, legendaris: 140 }
/** multiplier biaya upgrade per rarity. */
const RARITY_UPGRADE: Record<Rarity, number> = { umum: 0.85, langka: 1, epik: 1.15, legendaris: 1.35 }

/* ---------------- P8: funFact edukatif unik per power ---------------- */

/** Fakta islami ramah anak per kategori power (deterministik by id hash). */
const POWER_FACTS: Record<string, string[]> = {
  cahaya: [
    'Sholat adalah cahaya — yang rajin sholat 5 waktu hatinya ikut bercahaya! ✨',
    'Bangun subuh itu sindiran setan paling ampuh. Cahaya fajar bikin hari berkah! 🌅',
    'Kalimat thayyibah seperti lampu kecil yang menerangi hati siapa pun yang mengucapnya 💡',
  ],
  dzikir: [
    'Dzikir "Subhanallah, Alhamdulillah, Allahu Akbar" menenangkan hati seperti gelembung air 🫧',
    'Hati yang sering berdzikir ibarat tanaman disiram tiap hari — makin subur dan segar! 🌱',
    'Membaca dzikir pagi menambah semangat seharian, coba deh! 🌅',
  ],
  sedekah: [
    'Sedekah tidak pernah mengurangi harta — justru dibalas berlipat-lipat! 🪙',
    'Umar bin Khattab ra terkenal dermawan, uang sakunya selalu disisihkan untuk anak yatim 💝',
    'Sedekah bisa menolak bala, lho — walaupun cuma sepotong roti! 🍞',
  ],
  wangi: [
    'Nabi ﷺ menyukai kebersihan dan wewangian — wudhu bikin badan segar dan wangi! 💧',
    'Air wudhu yang membasuh wajah bikin muka bersinar sepanjang hari 🌟',
    'Kesucian itu separuh dari iman — wudhu adalah kuncinya! 🕌',
  ],
  nasihat: [
    'Menyampaikan nasihat itu amanah — kalimat lembut sampai ke hati! 💡',
    'Teman yang mengingatkan sholat adalah sahabat sejati di surga nanti 🤝',
    'Senyum dan kata positif bisa membuat temanmu semangat lagi! 😄',
  ],
  adzan: [
    'Bilal bin Rabah ra adalah muadzin pertama dengan suara paling merdu 📢',
    'Mendengar adzan lalu menjawabnya mendapat pahala seperti doa mustajab 🤲',
    'Ketika adzan berkumandang, setan kabur — sampai seolah-olah tidak terlihat! 🏃',
  ],
}

/* ---------------- P10: fakta edukatif tambahan per TEMA ---------------- */

/** Fakta islami ramah anak per tema asal karakter (kombinasi dengan fakta power
 *  memberi variasi jauh lebih banyak — 18 fakta power + 30 fakta tema). */
const THEME_FACTS: Record<string, string[]> = {
  santri_desa: [
    'Santri desa belajar sambil membantu orang tua — ilmu + amal jalan bareng! 🌾',
    'Belajar sambil memakai pengajaran "talaqqi" — guru membaca, santri mengulang, hati pun tenang 📖',
    'Di desa, suara kicau burung pagi menemani hafalan Quran — alam itu musik dakwah! 🐦',
  ],
  santri_kota: [
    'Santri kota hafal jadwal sholat di masjid terdekat — teknologi + ibadah seimbang! 🏙️',
    'Belajar agama sambil main itu boleh — Rasulullah ﷺ juga berlomba dengan anak kecil! 🏃',
    'Kota ramai? Hati yang berdzikir tetap tenang seperti tamanku hijau 🌳',
  ],
  pesantren: [
    'Di pesantren, santri belajar "Adab sebelum ilmu" — sopan santun lebih dulu! 📚',
    'Kamar pesantren sederhana tapi penuh barokah — makan bareng, doa bareng! 🙏',
    'Santri juga latihan mandiri: cuci baju sendiri, rapikan kasur sendiri — keren! 💪',
  ],
  yatim_ceria: [
    'Menyayangi anak yatim itu dekat sekali dengan Nabi ﷺ di surga kelak 💝',
    'Mengusap kepala anak yatim bisa melapangkan hati dan rezeki — coba deh! 🤗',
    'Anak yatim yang sabar punya ganjaran besar — mereka bukan sendiri, ada Allah! 🌈',
  ],
  juara_adzan: [
    'Lomba adzan itu seru — tapi niatkan utk mengajak orang sholat, bukan sekadar menang! 🏆',
    'Suara merdu itu anugerah — latihan tiap hari bikin makin mantap! 🎵',
    'Doa setelah adzan dijanjikan mustajab — jangan sampai ketinggalan! 🤲',
  ],
  penjahit: [
    'Kerajinan tangan itu ibadah kalau niatnya menolong sesama 🧵',
    'Menjahit sabar banget — satu jahitan salah, rapikan lagi — persis koreksi kesalahan dengan taubat! ✂️',
    'Pakaian rapi itu sunnah — Rasulullah ﷺ menyukai kebersihan & kerapian! 👕',
  ],
  petani: [
    'Petani syukur panen — dari tanah kering jadi makanan lezat, subhanallah! 🌱',
    'Menanam 1 pohon itu sedekah jariah — buahnya dimakan burung pun dapat pahala! 🌳',
    'Air hujan itu nikmat Allah — petani paling paham arti syukur! 🌧️',
  ],
  pedagang: [
    'Pedagang jujur akan bersama para nabi & syuhada di akhirat — jujur itu kunci! 🛒',
    'Tolak menolak dalam jual beli itu sunnah — tawar dengan sopan! 😊',
    'Rezeki halal walau sedikit lebih barokah daripada banyak tapi haram! 💰',
  ],
  dokter_cilik: [
    'Menyembuhkan hati lebih utama — senyum itu sedekah, dokter cilik! 🩺',
    'Ilmu kedokteran diawali Ibnu Sina — kitab "Al-Qanun" jadi rujukan dunia! 📜',
    'Membantu orang sakit itu ibadah — niatkan menolong sesama! 💚',
  ],
  imam_muda: [
    'Imam muda itu latihan tanggung jawab — memimpin sholat butuh khusyuk! 🕌',
    'Barangsiapa mengimami sholat, amanahnya berat: bacaan lurus & rapi! 📖',
    'Baca surat pendek dulu saat jadi imam — perhatikan yang sholat di belakang! 🤲',
  ],
  custom: [
    'Karya sendirimu, kemenanganmu sendiri — rawat dia seperti sahabat! 🎨',
    'Karakter buatanmu punya doa favorit — hafalkan satu doa harian yuk! 🤲',
    'Setiap karya unik — begitu pula setiap anak sholeh, tak ada yang sama! ✨',
  ],
}

/** hash string kecil → indeks deterministik. */
function hashPick(id: string, arr: string[]): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return arr[Math.abs(h) % arr.length]
}

/** funFact unik per karakter: kolam gabungan fakta power + fakta tema
 *  (P10 — variasi 6 pilihan per karakter, bukan 3) + rasa varian. */
function synthFunFact(rc: RosterChar, variantLabel: string): string {
  const pool = [...(POWER_FACTS[rc.power] ?? POWER_FACTS.cahaya), ...(THEME_FACTS[rc.theme] ?? [])]
  const fact = hashPick(rc.id, pool)
  return `${fact} (${variantLabel})`
}

const HERO_IDS = new Set<string>(['ali', 'aisyah', 'umar', 'fatimah', 'misbah', 'kakek'])

export function isHeroChar(id: string): id is CharId {
  return HERO_IDS.has(id)
}

const defCache = new Map<string, CharDef>()

/** Def karakter utk gameplay — hero, roster, atau custom. */
export function getCharDef(id: string): CharDef {
  if (isHeroChar(id)) return CHAR_DEFS[id]
  const cached = defCache.get(id)
  if (cached) return cached
  const rc = getRosterChar(id)
  const def = rc ? synthRosterDef(rc) : CHAR_DEFS.ali // fallback aman
  defCache.set(id, def)
  return def
}

/** Bersihkan cache (dipanggil saat custom chars berubah). */
export function invalidateCharDefCache() {
  defCache.clear()
}

/** Sintesis CharDef dari RosterChar — stats dari hero basis × varian × rarity. */
function synthRosterDef(rc: RosterChar): CharDef {
  const power = POWERS.find((p) => p.id === rc.power) ?? POWERS[0]
  const variant = power.variants.find((v) => v.id === rc.variant) ?? power.variants[0]
  const base = CHAR_DEFS[power.heroId as CharId]
  const rarityMult = RARITY_POWER[rc.rarity]
  const cost = RARITY_COST[rc.rarity]
  const upgMult = RARITY_UPGRADE[rc.rarity]

  const levels = base.levels.map((l) => ({
    damage: Math.max(1, Math.round(l.damage * variant.damageMult * rarityMult)),
    fireRate: Math.max(0.4, +(l.fireRate * variant.rateMult).toFixed(2)),
    range: Math.max(2, +(l.range * variant.rangeMult).toFixed(1)),
  })) as [CharLevelStats, CharLevelStats, CharLevelStats]

  const round2 = (n: number) => Math.round(n * 2) / 2
  const scaleArr = (arr?: number[]) =>
    arr ? (arr.map((n) => Math.max(1, round2(n * (variant.rangeMult + 1) / 2))) as number[]) : undefined

  const variantName = variant.label
  return {
    id: rc.id,
    name: `${rc.name} (${variantName})`,
    shortName: rc.name.split(' ')[0],
    role: `${power.label} · ${variantName}`,
    desc: rc.desc,
    funFact: synthFunFact(rc, variantName),
    emoji: rc.emoji,
    color: rc.robe,
    accent: rc.accent,
    skin: rc.skin,
    cost,
    upgradeCosts: [
      Math.round(base.upgradeCosts[0] * upgMult),
      Math.round(base.upgradeCosts[1] * upgMult),
    ],
    attack: power.attack,
    unlockWave: 1, // roster selalu terbuka jika sudah dimiliki
    levels,
    aoeRadius: scaleArr(base.aoeRadius),
    slowFactor: base.slowFactor ? [...base.slowFactor] : undefined,
    slowDuration: scaleArr(base.slowDuration),
    knockback: base.knockback ? +(base.knockback * (variant.id === 'mentul' ? 1.5 : 1)).toFixed(1) : undefined,
    stunDuration: base.stunDuration,
    pahalaGen: base.pahalaGen
      ? (base.pahalaGen.map(([amt, int]) => [
          Math.max(2, Math.round(amt * (variant.id === 'subur' ? 1.3 : variant.id === 'kilat' ? 0.9 : 1))),
          Math.max(2.5, +(int * (variant.id === 'kilat' ? 0.75 : 1)).toFixed(1)),
        ]) as [number, number][])
      : undefined,
    rarity: rc.rarity,
  }
}

/** Model 3D tower berdasar id — dipakai resolusi terpusat (models.ts memanggil ini). */
export function isCustomCharId(id: string): boolean {
  return id.startsWith('custom-')
}

export function getRosterCustomConfig(id: string) {
  return getCustomConfig(id)
}
