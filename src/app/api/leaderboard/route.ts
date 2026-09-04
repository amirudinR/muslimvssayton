import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// This route reads live data from the database on every request (no caching).
export const dynamic = 'force-dynamic'

/** How many entries the public leaderboard shows. */
const TOP_N = 10
/** How many best entries are kept around after each new submission. */
const MAX_KEEP = 50

/** Ranking: stars desc, then defeated desc, then pahala desc, then oldest first. */
const RANK_ORDER: Prisma.ScoreEntryOrderByWithRelationInput[] = [
  { stars: 'desc' },
  { defeated: 'desc' },
  { pahala: 'desc' },
  { createdAt: 'asc' },
]

const NAME_MIN = 2
const NAME_MAX = 16

interface ScorePayload {
  name: string
  stars: number
  wave: number
  defeated: number
  pahala: number
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

  const stars = intInRange(raw.stars, 1, 3)
  if (stars === null) {
    return { ok: false, error: 'Field "stars" must be an integer between 1 and 3' }
  }
  const wave = intInRange(raw.wave, 0, 10)
  if (wave === null) {
    return { ok: false, error: 'Field "wave" must be an integer between 0 and 10' }
  }
  const defeated = intInRange(raw.defeated, 0, 9999)
  if (defeated === null) {
    return { ok: false, error: 'Field "defeated" must be an integer between 0 and 9999' }
  }
  const pahala = intInRange(raw.pahala, 0, 999999)
  if (pahala === null) {
    return { ok: false, error: 'Field "pahala" must be an integer between 0 and 999999' }
  }

  return { ok: true, data: { name, stars, wave, defeated, pahala } }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** GET /api/leaderboard — top 10 entries, ranked. */
export async function GET() {
  try {
    const entries = await db.scoreEntry.findMany({
      orderBy: RANK_ORDER,
      take: TOP_N,
    })
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
    const entry = await db.scoreEntry.create({ data: parsed.data })

    // Prune: keep only the best MAX_KEEP entries, delete everything else.
    const keep = await db.scoreEntry.findMany({
      orderBy: RANK_ORDER,
      take: MAX_KEEP,
      select: { id: true },
    })
    if (keep.length >= MAX_KEEP) {
      await db.scoreEntry.deleteMany({
        where: { id: { notIn: keep.map((k) => k.id) } },
      })
    }

    return NextResponse.json({ ok: true, entry })
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 })
  }
}
