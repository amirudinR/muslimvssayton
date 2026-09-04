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
    funFact: `${rc.name} siap menjaga masjid bersama regu anak sholeh!`,
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
