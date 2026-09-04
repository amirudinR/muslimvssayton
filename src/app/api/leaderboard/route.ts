import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// This route reads live data from the database on every request (no caching).
export const dynamic = 'force-dynamic'

/* Catatan: akses via raw SQL agar kompatibel dengan client Prisma yang
   berjalan di dev server lama (kolom `mode` P8 ditambahkan tanpa restart).
   Raw query tetap valid untuk client baru juga. */

interface LeaderRow {
  id: number
  name: string
  stars: number
  wave: number
  defeated: number
  pahala: number
  mode: string
  createdAt: string
}

const RANK_SQL =
  'ORDER BY stars DESC, defeated DESC, pahala DESC, createdAt ASC'

/** How many entries the public leaderboard shows. */
const TOP_N = 10
/** How many best entries are kept around after each new submission. */
const MAX_KEEP = 50

/** Ranking: stars desc, then defeated desc, then pahala desc, then oldest first. */

const NAME_MIN = 2
const NAME_MAX = 16
const MODE_MAX = 24

/** Mode label yang diizinkan di papan rekor (P8 + P9 mingguan). */
const MODE_WHITELIST = ['Klasik', 'Daring Harian', 'Tantangan Mingguan', 'Tak Berujung']

/** Sanitasi label mode: whitelist / pola "Level N" / fallback "Klasik". */
function sanitizeMode(value: unknown): string {
  if (typeof value !== 'string') return 'Klasik'
  const label = value.trim().slice(0, MODE_MAX)
  if (MODE_WHITELIST.includes(label)) return label
  if (/^Level \d{1,2}$/i.test(label)) return label
  return 'Klasik'
}

interface ScorePayload {
  name: string
  stars: number
  wave: number
  defeated: number
  pahala: number
  mode: string
}

type ValidationResult =
  | { ok: true; data: ScorePayload }
  | { ok: false; error: string }

/** Returns `value` when it is an integer within [min, max], otherwise `null`. */
function intInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < min || value > max) return null
  return value
}

function validatePayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }
  const raw = body as Record<string, unknown>

  if (typeof raw.name !== 'string') {
    return { ok: false, error: 'Field "name" must be a string' }
  }
  const name = raw.name.trim().slice(0, NAME_MAX)
  if (name.length < NAME_MIN) {
    return { ok: false, error: `Name must be ${NAME_MIN}-${NAME_MAX} characters (after trimming)` }
  }

  /* P11: stars 0 diperbolehkan (kekalahan Tak Berujung — gelombang jadi sorotan),
     wave hingga 999 utk gelombang endless yang terus bertambah. */
  const stars = intInRange(raw.stars, 0, 3)
  if (stars === null) {
    return { ok: false, error: 'Field "stars" must be an integer between 0 and 3' }
  }
  const wave = intInRange(raw.wave, 0, 999)
  if (wave === null) {
    return { ok: false, error: 'Field "wave" must be an integer between 0 and 999' }
  }
  const defeated = intInRange(raw.defeated, 0, 9999)
  if (defeated === null) {
    return { ok: false, error: 'Field "defeated" must be an integer between 0 and 9999' }
  }
  const pahala = intInRange(raw.pahala, 0, 999999)
  if (pahala === null) {
    return { ok: false, error: 'Field "pahala" must be an integer between 0 and 999999' }
  }

  return { ok: true, data: { name, stars, wave, defeated, pahala, mode: sanitizeMode(raw.mode) } }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

const SELECT_COLS = 'id, name, stars, wave, defeated, pahala, mode, createdAt'

/** GET /api/leaderboard — top 10 entries, ranked. */
export async function GET() {
  try {
    const entries = (await db.$queryRawUnsafe(
      `SELECT ${SELECT_COLS} FROM ScoreEntry ${RANK_SQL} LIMIT ${TOP_N}`,
    )) as LeaderRow[]
    return NextResponse.json({ ok: true, entries })
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 })
  }
}

/** POST /api/leaderboard — submit a score, then prune to the best 50. */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = validatePayload(body)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO ScoreEntry (name, stars, wave, defeated, pahala, mode, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      parsed.data.name,
      parsed.data.stars,
      parsed.data.wave,
      parsed.data.defeated,
      parsed.data.pahala,
      parsed.data.mode,
    )

    // Prune: keep only the best MAX_KEEP entries, delete everything else.
    const keep = (await db.$queryRawUnsafe(
      `SELECT id FROM ScoreEntry ${RANK_SQL} LIMIT ${MAX_KEEP}`,
    )) as { id: number }[]
    if (keep.length >= MAX_KEEP) {
      await db.$executeRawUnsafe(
        `DELETE FROM ScoreEntry WHERE id NOT IN (${keep.map((k) => k.id).join(',')})`,
      )
    }

    const row = (await db.$queryRawUnsafe(
      `SELECT ${SELECT_COLS} FROM ScoreEntry ${RANK_SQL} LIMIT 1`,
    )) as LeaderRow[]
    return NextResponse.json({ ok: true, entry: row[0] ?? null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 })
  }
}
