/* ============================================================
 * PENJAGA MASJID — Entities: Enemy, Tower, Projectile, Manager.
 * Semua interaksi gameplay (serang, kliyengan, kabur, boss).
 * ============================================================ */

import * as THREE from 'three'
import {
  CHAR_DEFS,
  ENEMY_DEFS,
  DUA_CONST,
  LANES,
  RUN_MODS,
  type CharId,
  type CharDef,
  type EnemyDef,
  type EnemyId,
} from './data'
import {
  getCharacterModel,
  getEnemyModel,
  createOrb,
  createBubble,
  createCoin,
  createRangeRing,
  type ChibiParts,
} from './models'
import { ParticleSystem } from './particles'
import { audio } from './audio'

/* ------------------------- util jalur (lane) ------------------------- */

interface LaneData {
  pts: THREE.Vector2[]
  cum: number[]
  total: number
}

const laneData: LaneData[] = LANES.map((lane) => {
  const pts = lane.map(([x, z]) => new THREE.Vector2(x, z))
  const cum = [0]
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]))
  }
  return { pts, cum, total: cum[cum.length - 1] }
})

function lanePoint(lane: number, dist: number, out: THREE.Vector2): THREE.Vector2 {
  const d = laneData[lane]
  const clamped = Math.max(0, Math.min(d.total, dist))
  let i = 0
  while (i < d.cum.length - 2 && d.cum[i + 1] < clamped) i++
  const segLen = d.cum[i + 1] - d.cum[i] || 1
  const t = (clamped - d.cum[i]) / segLen
  out.copy(d.pts[i]).lerp(d.pts[i + 1], t)
  return out
}

function laneDir(lane: number, dist: number): THREE.Vector2 {
  const d = laneData[lane]
  const clamped = Math.max(0, Math.min(d.total - 0.01, dist))
  let i = 0
  while (i < d.cum.length - 2 && d.cum[i + 1] < clamped) i++
  return d.pts[i + 1].clone().sub(d.pts[i]).normalize()
}

/* --------------------------- konteks update --------------------------- */

export interface ManagerCtx {
  now: number // waktu game terakumulasi (terpengaruh speed & pause)
  particles: ParticleSystem
  /** Doa Bersama aktif hingga waktu ini (membuff semua tower) */
  duaActiveUntil: number
  onEnemyKilled: (reward: number, pos: THREE.Vector3, enemyId: EnemyId) => void
  onEnemyLeaked: (enemy: Enemy) => void
  onBossShockwave: (duration: number) => void
  /** Misbah: pahala hasil kotak sedekah */
  onPahalaTick: (amount: number, pos: THREE.Vector3, level: number) => void
}

const tmpVec = new THREE.Vector2()
const tmpVec3 = new THREE.Vector3()

/* ================================ ENEMY ================================ */

export class Enemy {
  readonly def: EnemyDef
  readonly id: number
  hp: number
  maxHp: number
  lane: number
  dist = 0
  dead = false
  leaked = false
  escaped = false
  fleeing = false
  fleeRewardGiven = false
  group: THREE.Group
  slowUntil = -1
  slowFactor = 1
  buffUntil = -1
  stunUntil = -1
  dizzyUntil = -1
  knockFlash = 0
  private nextBuff = 0
  private nextSmoke = 0
  private nextShock = 0
  private animT = Math.random() * 10
  private dizzyStars: THREE.Mesh[] = []
  private headY: number

  constructor(enemyId: EnemyId, id: number, lane: number, wave: number) {
    this.def = ENEMY_DEFS[enemyId]
    this.id = id
    this.lane = lane
    this.maxHp = Math.round(this.def.hp * (1 + 0.12 * (wave - 1)) * RUN_MODS.enemyHpMult)
    this.hp = this.maxHp
    this.group = getEnemyModel(enemyId)
    this.headY = {
      pocong: 1.55, kunti: 1.85, genderuwo: 1.7, tuyul: 1.35, wewe: 1.95, kuyang: 1.35, banaspati: 2.6,
      // P5:
      sundel: 2.0, leak: 1.65, kolongwewe: 1.45, jailangkung: 1.7, bunian: 1.6, butoijo: 2.35,
      nyiblorong: 1.75, palasik: 1.55, suster: 1.65, cindaku: 1.75, gendruwo: 2.25, wewerawa: 2.0, kober: 1.55,
    }[enemyId]
    // bintang kliyengan (orbit di atas kepala)
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xffb520, emissiveIntensity: 0.9 })
    for (let i = 0; i < 3; i++) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), starMat)
      star.visible = false
      this.group.add(star)
      this.dizzyStars.push(star)
    }
    lanePoint(lane, 0, tmpVec)
    this.group.position.set(tmpVec.x, 0, tmpVec.y)
    // boss masuk sambil terpeleset (spin lucu)
    if (this.def.isBoss) {
      this.group.userData.spinIntro = 1.6
      this.nextShock = 4
    }
  }

  get pos(): THREE.Vector3 {
    return this.group.position
  }

  takeDamage(amount: number, ctx: ManagerCtx, opts: { knockback?: number; stun?: number; slow?: { factor: number; duration: number } } = {}) {
    if (this.dead || this.escaped) return
    this.hp -= amount
    this.dizzyUntil = ctx.now + 0.55
    this.knockFlash = 0.25
    ctx.particles.showDamage(this.pos.x, this.headY + 0.4, this.pos.z, amount, undefined, this.def.isBoss)
    if (opts.knockback) {
      const resist = this.def.knockResist ?? 0
      this.dist = Math.max(0, this.dist - opts.knockback * (1 - resist))
    }
    if (opts.stun) this.stunUntil = ctx.now + opts.stun
    if (opts.slow && !this.def.slowImmune) {
      this.slowUntil = ctx.now + opts.slow.duration
      this.slowFactor = Math.min(this.slowFactor, opts.slow.factor)
    }
    if (this.hp <= 0) {
      this.die(ctx)
      return
    }
    // Wewe kabur malu-malu saat kena serangan pertama
    if (this.def.fleesOnHit && !this.fleeing) {
      this.fleeing = true
      audio.giggle()
      ctx.particles.showDamage(this.pos.x, this.headY + 0.9, this.pos.z, 6, '#e86a92')
      if (!this.fleeRewardGiven) {
        this.fleeRewardGiven = true
        ctx.onEnemyKilled(6, this.pos.clone(), this.def.id)
      }
    }
    if (!this.def.isBoss) audio.hit()
  }

  private die(ctx: ManagerCtx) {
    this.dead = true
    audio.pop()
    if (Math.random() < 0.35) audio.giggle()
    ctx.particles.deathPoof(this.pos.x, 0.6, this.pos.z)
    ctx.onEnemyKilled(this.def.reward, this.pos.clone(), this.def.id)
  }

  update(dt: number, ctx: ManagerCtx, enemies: Enemy[]) {
    if (this.dead || this.leaked || this.escaped) return
    const now = ctx.now
    this.animT += dt

    // efek kliyengan / stun: bintang berputar di atas kepala
    const dizzy = now < this.dizzyUntil
    this.dizzyStars.forEach((s, i) => {
      s.visible = dizzy
      if (dizzy) {
        const a = now * 6 + (i / 3) * Math.PI * 2
        s.position.set(Math.cos(a) * 0.45, this.headY + 0.35, Math.sin(a) * 0.45)
        s.rotation.y += dt * 8
        s.rotation.x = Math.PI / 2
      }
    })

    // kecepatan efektif
    let speed = this.def.speed * RUN_MODS.enemySpeedMult
    if (now < this.slowUntil) speed *= this.slowFactor
    else this.slowFactor = 1
    if (now < this.buffUntil) speed *= 1.35 // semangat karena ketawaan kunti
    const stunned = now < this.stunUntil

    // boss: ngambek — asap ungu + shockwave
    if (this.def.isBoss) {
      if (now > this.nextSmoke) {
        this.nextSmoke = now + 0.45
        ctx.particles.smokePuff(this.pos.x, this.headY + 0.5, this.pos.z)
      }
      if (now > this.nextShock) {
        this.nextShock = now + 6
        audio.bossNgambek()
        ctx.particles.rings.spawn(this.pos.x, 0.1, this.pos.z, 0xc39bff, 10, 0.9)
        ctx.onBossShockwave(2)
      }
      const flames = this.group.userData.parts?.flames as THREE.Mesh[] | undefined
      if (flames) {
        flames.forEach((f, i) => {
          f.scale.setScalar(1 + Math.sin(this.animT * 6 + i * 1.7) * 0.22)
        })
      }
      // intro terpeleset lucu
      const spin = this.group.userData.spinIntro as number | undefined
      if (spin && spin > 0) {
        this.group.userData.spinIntro = spin - dt
        this.group.rotation.y += dt * 10
        this.group.position.y = Math.max(0, Math.sin(spin * 6) * 0.8)
      }
    }

    if (!stunned) {
      if (this.fleeing) {
        // kabur terbirit-birit ke arah spawn
        this.dist -= this.def.speed * 3.2 * dt
        if (this.dist <= 0) {
          this.escaped = true
          ctx.particles.deathPoof(this.pos.x, 0.5, this.pos.z)
          return
        }
      } else {
        this.dist += speed * dt
        if (this.dist >= laneData[this.lane].total) {
          this.leaked = true
          ctx.onEnemyLeaked(this)
          return
        }
      }
    }

    // posisi sepanjang jalur + wobble lucu
    lanePoint(this.lane, this.dist, tmpVec)
    let y = 0
    const parts = this.group.userData.parts as Record<string, unknown> | undefined
    if (this.def.id === 'pocong') {
      y = Math.abs(Math.sin(this.animT * 7)) * 0.45
      this.group.scale.y = this.def.scale * (1 - Math.abs(Math.sin(this.animT * 7)) * 0.1)
    } else if (this.def.id === 'kunti') {
      y = 0.25 + Math.sin(this.animT * 3) * 0.12
      if (parts?.head) (parts.head as THREE.Object3D).rotation.z = Math.sin(this.animT * 5) * 0.12
    } else if (this.def.id === 'genderuwo') {
      this.group.rotation.z = Math.sin(this.animT * 4) * 0.08
      if (parts?.armL) {
        ;(parts.armL as THREE.Object3D).rotation.x = Math.sin(this.animT * 4) * 0.5
        ;(parts.armR as THREE.Object3D).rotation.x = -Math.sin(this.animT * 4) * 0.5
      }
    } else if (this.def.id === 'tuyul') {
      const lateral = Math.sin(this.animT * 9) * 0.5
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
      this.group.rotation.z = Math.sin(this.animT * 9) * 0.15
      if (parts?.coin) (parts.coin as THREE.Object3D).rotation.z += dt * 6
    } else if (this.def.id === 'wewe') {
      y = Math.abs(Math.sin(this.animT * 5)) * 0.18
      if (this.fleeing) {
        this.group.rotation.x = -0.25 // condong kabur
      }
    } else if (this.def.id === 'kuyang') {
      // melayang: naik-turun lembut + goyang sayap & rambut
      y = 1.15 + Math.sin(this.animT * 3.2) * 0.25
      const lateral = Math.sin(this.animT * 2.1) * 0.3
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
      if (parts?.wingL) {
        const flap = Math.sin(this.animT * 13) * 0.55
        ;(parts.wingL as THREE.Object3D).rotation.z = 0.45 + flap
        ;(parts.wingR as THREE.Object3D).rotation.z = -0.45 - flap
        ;(parts.wingL as THREE.Object3D).position.y = 1.0 + flap * 0.12
        ;(parts.wingR as THREE.Object3D).position.y = 1.0 + flap * 0.12
      }
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) {
        strands.forEach((s, i) => {
          s.rotation.x = Math.sin(this.animT * 5 + i) * 0.35
          s.rotation.z = Math.cos(this.animT * 4 + i) * 0.2
        })
      }
      if (parts?.ribbon) (parts.ribbon as THREE.Object3D).rotation.z = Math.sin(this.animT * 6) * 0.2
    } else if (this.def.id === 'banaspati') {
      y = 0.3 + Math.sin(this.animT * 2.2) * 0.2
    } else if (this.def.id === 'sundel') {
      // melayang pelan + pita berkibar
      y = 0.55 + Math.sin(this.animT * 2.6) * 0.22
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) {
        strands.forEach((s, i) => {
          s.rotation.x = 0.5 + Math.sin(this.animT * 3.4 + i) * 0.4
          s.rotation.z = Math.cos(this.animT * 2.8 + i) * 0.3
        })
      }
      this.group.rotation.z = Math.sin(this.animT * 2.0) * 0.06
    } else if (this.def.id === 'leak') {
      // zig-zag cepat + ekor pita warna-warni memuntir
      y = 1.0 + Math.sin(this.animT * 4.2) * 0.28
      const lateral = Math.sin(this.animT * 5.5) * 0.8
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) {
        strands.forEach((s, i) => {
          s.rotation.z = Math.sin(this.animT * 8 + i * 1.3) * 0.5
        })
      }
    } else if (this.def.id === 'kolongwewe') {
      // jongkok goyang — mata ngintip kiri-kanan
      this.group.rotation.z = Math.sin(this.animT * 6) * 0.08
      if (parts?.head) (parts.head as THREE.Object3D).rotation.z = Math.sin(this.animT * 2.4) * 0.35
      y = Math.abs(Math.sin(this.animT * 5)) * 0.08
    } else if (this.def.id === 'jailangkung') {
      // gerakan patah-patah (stop-motion) — kaku tiap 0.2 detik
      const stepT = Math.floor(this.animT * 5) / 5
      this.group.rotation.y += Math.sin(stepT * 8) * 0.02
      y = Math.abs(Math.sin(stepT * 7)) * 0.3
      if (parts?.armL) {
        ;(parts.armL as THREE.Object3D).rotation.z = -0.5 + Math.sin(stepT * 10) * 0.7
        ;(parts.armR as THREE.Object3D).rotation.z = 0.5 - Math.sin(stepT * 10) * 0.7
      }
    } else if (this.def.id === 'bunian') {
      // jalan cepat malu-malu + topi daun goyang
      y = Math.abs(Math.sin(this.animT * 8)) * 0.16
      if (parts?.hat) (parts.hat as THREE.Object3D).rotation.z = Math.sin(this.animT * 6) * 0.18
      this.group.rotation.z = Math.sin(this.animT * 9) * 0.1
    } else if (this.def.id === 'butoijo') {
      // badan besar goyangan lambat + lengan ayun
      this.group.rotation.z = Math.sin(this.animT * 3) * 0.05
      if (parts?.armL) {
        ;(parts.armL as THREE.Object3D).rotation.x = Math.sin(this.animT * 3) * 0.4
        ;(parts.armR as THREE.Object3D).rotation.x = -Math.sin(this.animT * 3) * 0.4
      }
      y = Math.abs(Math.sin(this.animT * 4)) * 0.12
    } else if (this.def.id === 'nyiblorong') {
      // meliuk-meliuk ular + ekor bergelombang
      const lateral = Math.sin(this.animT * 3.5) * 0.6
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) {
        strands.forEach((s, i) => {
          s.position.x = Math.sin(this.animT * 4 + i * 1.1) * 0.25
        })
      }
      y = Math.abs(Math.sin(this.animT * 6)) * 0.14
    } else if (this.def.id === 'palasik') {
      // melayang ringan + selimut berkibar
      y = 0.5 + Math.sin(this.animT * 3.0) * 0.2
      this.group.rotation.z = Math.sin(this.animT * 2.5) * 0.08
      if (parts?.body) (parts.body as THREE.Object3D).rotation.z = Math.sin(this.animT * 4) * 0.12
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) strands.forEach((s, i) => { s.rotation.x = 0.4 + Math.sin(this.animT * 5 + i) * 0.3 })
    } else if (this.def.id === 'suster') {
      // ngesot breakdance — condong belakang + kaki geser
      this.group.rotation.x = -0.22 + Math.sin(this.animT * 8) * 0.06
      y = Math.abs(Math.sin(this.animT * 6)) * 0.05
      const lateral = Math.sin(this.animT * 7) * 0.3
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
    } else if (this.def.id === 'cindaku') {
      // jalan tegak gesit + ekor goyang
      y = Math.abs(Math.sin(this.animT * 6.5)) * 0.18
      const strands = parts?.strands as THREE.Object3D[] | undefined
      if (strands) strands.forEach((s) => { s.rotation.z = Math.sin(this.animT * 7) * 0.5 })
      this.group.rotation.z = Math.sin(this.animT * 6) * 0.06
    } else if (this.def.id === 'gendruwo') {
      // gempal goyang + lengan ayun lebar
      this.group.rotation.z = Math.sin(this.animT * 2.8) * 0.06
      if (parts?.armL) {
        ;(parts.armL as THREE.Object3D).rotation.x = Math.sin(this.animT * 2.6) * 0.5
        ;(parts.armR as THREE.Object3D).rotation.x = -Math.sin(this.animT * 2.6) * 0.5
      }
      y = Math.abs(Math.sin(this.animT * 3.5)) * 0.14
    } else if (this.def.id === 'wewerawa') {
      // santai gemoy + payung teratai bergoyang
      this.group.rotation.z = Math.sin(this.animT * 2.2) * 0.05
      if (parts?.umbrella) {
        (parts.umbrella as THREE.Object3D).rotation.z = Math.sin(this.animT * 2.4) * 0.16
      }
      y = Math.abs(Math.sin(this.animT * 3.2)) * 0.1
    } else if (this.def.id === 'kober') {
      // lari usil cepat + cape berkibar + zigzag kecil
      const lateral = Math.sin(this.animT * 8) * 0.4
      const dir = laneDir(this.lane, this.dist)
      tmpVec.x += -dir.y * lateral
      tmpVec.y += dir.x * lateral
      y = Math.abs(Math.sin(this.animT * 9)) * 0.2
      if (parts?.cape) (parts.cape as THREE.Object3D).rotation.x = 0.4 + Math.sin(this.animT * 6) * 0.25
      this.group.rotation.z = Math.sin(this.animT * 9) * 0.12
    }

    // wobble kena pukul
    if (this.knockFlash > 0) {
      this.knockFlash -= dt
      this.group.rotation.z += Math.sin(now * 30) * 0.04
    }

    this.group.position.set(tmpVec.x, y, tmpVec.y)

    // menghadap arah gerak
    const faceDir = this.fleeing ? laneDir(this.lane, Math.max(0.01, this.dist)).negate() : laneDir(this.lane, this.dist)
    const targetRot = Math.atan2(faceDir.x, faceDir.y)
    let dRot = targetRot - this.group.rotation.y
    while (dRot > Math.PI) dRot -= Math.PI * 2
    while (dRot < -Math.PI) dRot += Math.PI * 2
    this.group.rotation.y += dRot * Math.min(1, dt * 10)

    // kunti: ketawa cekikikan → buff teman sekitar
    if (this.def.buff && !this.fleeing && !stunned) {
      if (now > this.nextBuff) {
        this.nextBuff = now + this.def.buff.interval
        audio.giggle()
        ctx.particles.rings.spawn(this.pos.x, 0.1, this.pos.z, 0xff9ecb, this.def.buff.radius, 0.7)
        enemies.forEach((e) => {
          if (e !== this && !e.dead && !e.leaked && e.pos.distanceTo(this.pos) < this.def.buff!.radius) {
            e.buffUntil = now + this.def.buff!.duration
          }
        })
      }
    }
  }

  dispose(scene: THREE.Object3D) {
    scene.remove(this.group)
  }
}

/* ================================ TOWER ================================ */

export class Tower {
  readonly def: CharDef
  readonly slotIndex: number
  level = 1
  group: THREE.Group
  private parts: ChibiParts
  cooldown = 0.5
  stunUntil = -1
  stunnedAnim = 0
  private animT = Math.random() * 10
  private waveTimer = Math.random() * 4
  private punchTimer = 0
  rangeRing: THREE.Mesh
  /** cincin keemasan berkah Doa Bersama di bawah kaki */
  duaGlow: THREE.Mesh
  totalSpent: number

  constructor(charId: CharId, slotIndex: number, x: number, z: number, baseCost: number) {
    this.def = CHAR_DEFS[charId]
    this.slotIndex = slotIndex
    this.totalSpent = baseCost
    this.group = getCharacterModel(charId, 1)
    this.group.position.set(x, 0, z)
    this.parts = this.group.userData.parts as ChibiParts
    const stats = this.def.levels[0]
    this.rangeRing = createRangeRing(stats.range, 0x9ff2c8)
    this.rangeRing.position.set(x, 0, z)
    this.rangeRing.visible = false
    this.duaGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.95, 26),
      new THREE.MeshBasicMaterial({
        color: 0xffd76a,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    )
    this.duaGlow.rotation.x = -Math.PI / 2
    this.duaGlow.position.set(x, 0.06, z)
    this.duaGlow.visible = false
  }

  get stats() {
    return this.def.levels[this.level - 1]
  }

  get pos(): THREE.Vector3 {
    return this.group.position
  }

  setLevel(level: number) {
    const x = this.group.position.x
    const z = this.group.position.z
    this.level = level
    this.group = getCharacterModel(this.def.id, level)
    this.group.position.set(x, 0, z)
    this.parts = this.group.userData.parts as ChibiParts
    const stats = this.def.levels[level - 1]
    this.rangeRing.scale.setScalar(stats.range / this.def.levels[0].range)
  }

  stun(now: number, duration: number) {
    this.stunUntil = Math.max(this.stunUntil, now + duration)
  }

  update(dt: number, ctx: ManagerCtx, enemies: Enemy[]) {
    const now = ctx.now
    this.animT += dt
    const stunned = now < this.stunUntil

    /* --- animasi idle lucu --- */
    const bob = Math.sin(this.animT * 2.4) * 0.04
    this.parts.body.position.y = 0.78 + bob
    this.parts.head.rotation.z = Math.sin(this.animT * 1.8) * 0.08
    // melambai sesekali
    this.waveTimer -= dt
    if (this.waveTimer <= 0) this.waveTimer = 3 + Math.random() * 4
    const waving = this.waveTimer < 1.2 && !stunned
    const armWave = waving ? Math.sin(this.animT * 10) * 0.7 : 0
    this.parts.armR.rotation.z = -0.5 + (this.punchTimer > 0 ? -1.2 * this.punchTimer : -armWave)
    this.parts.armL.rotation.z = 0.5 + armWave * 0.4
    // bintang level melayang
    this.parts.stars.forEach((s, i) => {
      s.position.y = s.userData.baseY + Math.sin(this.animT * 3 + i) * 0.07
      s.rotation.y += dt * 2
    })
    if (this.parts.glow) {
      this.parts.glow.scale.setScalar(1 + Math.sin(this.animT * 4) * 0.08)
    }
    if (this.punchTimer > 0) this.punchTimer -= dt * 3

    /* --- animasi khusus Misbah: koin sedekah melayang + lampion berdenyut --- */
    if (this.parts.koinSedekah) {
      this.parts.koinSedekah.position.y = 1.3 + Math.sin(this.animT * 2.6) * 0.1
      this.parts.koinSedekah.rotation.z = Math.sin(this.animT * 2.2) * 0.3
    }
    if (this.parts.lampion) {
      const lm = this.parts.lampion as THREE.Mesh
      const mat = lm.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.9 + Math.sin(this.animT * 3.4) * 0.5
      lm.position.x = -0.72 + Math.sin(this.animT * 1.8) * 0.03
    }

    if (stunned) {
      this.stunnedAnim += dt
      this.group.rotation.z = Math.sin(this.stunnedAnim * 18) * 0.08
      return
    }
    this.group.rotation.z *= 0.9

    /* --- berkah Doa Bersama: aura keemasan di kaki --- */
    if (this.duaGlow) {
      const blessed = now < ctx.duaActiveUntil
      this.duaGlow.visible = blessed
      if (blessed) {
        this.duaGlow.rotation.z += dt * 2.5
        this.duaGlow.scale.setScalar(1 + Math.sin(this.animT * 5) * 0.12)
      }
    }

    /* --- serangan --- */
    this.cooldown -= dt
    if (this.cooldown > 0) return
    const stats = this.stats
    const blessed = now < ctx.duaActiveUntil
    const dmg = blessed ? stats.damage * DUA_CONST.damageMult : stats.damage

    if (this.def.attack === 'aura') {
      // Fatimah: denyut aroma wangi — AoE slow di sekitar
      this.cooldown = stats.fireRate * (blessed ? DUA_CONST.rateMult : 1)
      const inRange = enemies.filter((e) => !e.dead && !e.leaked && !e.escaped && e.pos.distanceTo(this.pos) < stats.range)
      if (inRange.length > 0) {
        ctx.particles.slowPulse(this.pos.x, 0.8, this.pos.z, stats.range)
        audio.swoosh()
        const slow = {
          factor: this.def.slowFactor![this.level - 1],
          duration: this.def.slowDuration![this.level - 1],
        }
        inRange.forEach((e) => e.takeDamage(dmg, ctx, { slow }))
        this.punchTimer = 1
      }
      return
    }

    if (this.def.attack === 'sedekah') {
      // Misbah: kotak sedekah — hasilkan pahala pasif (tidak menyerang).
      // Berkah Doa Bersama melipatgandakan sedekahnya (interval lebih cepat).
      this.cooldown = stats.fireRate * (blessed ? DUA_CONST.rateMult : 1)
      const [amount] = this.def.pahalaGen![this.level - 1]
      ctx.onPahalaTick(amount, this.pos.clone(), this.level)
      return
    }

    if (this.def.attack === 'adzan') {
      // Kakek Imam: cahaya adzan menyapu seluruh layar
      this.cooldown = stats.fireRate * (blessed ? DUA_CONST.rateMult : 1)
      const alive = enemies.filter((e) => !e.dead && !e.leaked && !e.escaped)
      if (alive.length > 0) {
        audio.adzanChime()
        ctx.particles.adzanWave(this.pos.x, 1, this.pos.z)
        alive.forEach((e) =>
          e.takeDamage(dmg, ctx, { knockback: this.def.knockback, stun: this.def.stunDuration }),
        )
        this.punchTimer = 1.4
        return
      }
      this.cooldown = 0.5 // coba lagi sebentar lagi
      return
    }

    // cari target "terdepan" (paling dekat masjid) dalam jangkauan
    let target: Enemy | null = null
    let bestDist = -1
    for (const e of enemies) {
      if (e.dead || e.leaked || e.escaped || e.fleeing) continue
      if (e.pos.distanceTo(this.pos) > stats.range) continue
      if (e.dist > bestDist) {
        bestDist = e.dist
        target = e
      }
    }
    if (!target) return
    this.cooldown = stats.fireRate * (blessed ? DUA_CONST.rateMult : 1)
    this.punchTimer = 1
    const muzzleY = 1.3
    const muzzle = tmpVec3.set(this.pos.x, muzzleY, this.pos.z)

    if (this.def.attack === 'orb') {
      ctx.particles.muzzle(muzzle.x, muzzle.y, muzzle.z)
      audio.swoosh()
      ctxManagerSpawnProjectile('orb', this, target, dmg)
    } else if (this.def.attack === 'bubble') {
      ctx.particles.muzzle(muzzle.x, muzzle.y, muzzle.z, 0xffc7e5)
      audio.bubble()
      ctxManagerSpawnProjectile('bubble', this, target, dmg)
    } else if (this.def.attack === 'coin') {
      audio.coin()
      ctxManagerSpawnProjectile('coin', this, target, dmg)
    }
  }
}

/* ============================== PROJECTILE ============================== */

type ProjKind = 'orb' | 'bubble' | 'coin'

export class Projectile {
  kind: ProjKind
  mesh: THREE.Mesh
  from = new THREE.Vector3()
  targetPos = new THREE.Vector3()
  target: Enemy | null = null
  owner: Tower
  damage = 0
  t = 0
  dur = 0.5
  aoeRadius = 0
  slowDur = 0
  knockback = 0
  alive = false

  constructor(kind: ProjKind, owner: Tower) {
    this.kind = kind
    this.owner = owner
    this.mesh =
      kind === 'orb' ? createOrb() : kind === 'bubble' ? createBubble() : createCoin()
  }
}

/* ============================== MANAGER ============================== */

let projectileSpawner: ((kind: ProjKind, tower: Tower, target: Enemy, damage: number) => void) | null = null
function ctxManagerSpawnProjectile(kind: ProjKind, tower: Tower, target: Enemy, damage: number) {
  projectileSpawner?.(kind, tower, target, damage)
}

export class EntityManager {
  enemies: Enemy[] = []
  towers: Tower[] = []
  projectiles: Projectile[] = []
  group = new THREE.Group()
  private enemyIdCounter = 1
  private projPool: Record<ProjKind, Projectile[]> = { orb: [], bubble: [], coin: [] }
  private ctx: ManagerCtx

  constructor(particles: ParticleSystem, ctxCallbacks: Omit<ManagerCtx, 'particles' | 'now' | 'duaActiveUntil'>) {
    this.ctx = { now: 0, duaActiveUntil: -1, particles, ...ctxCallbacks }
    projectileSpawner = (kind, tower, target, damage) => this.spawnProjectile(kind, tower, target, damage)
  }

  get now() {
    return this.ctx.now
  }

  /** Doa Bersama: aktifkan berkah untuk semua tower selama `duration` detik. */
  activateDuaBlessing(duration: number) {
    this.ctx.duaActiveUntil = this.ctx.now + duration
  }

  get duaBlessed() {
    return this.ctx.now < this.ctx.duaActiveUntil
  }

  reset() {
    this.enemies.forEach((e) => e.dispose(this.group))
    this.enemies = []
    this.towers.forEach((t) => {
      this.group.remove(t.group)
      this.group.remove(t.rangeRing)
      this.group.remove(t.duaGlow)
    })
    this.towers = []
    this.projectiles.forEach((p) => {
      if (p.alive) this.group.remove(p.mesh)
      p.alive = false
    })
    this.projectiles = []
    this.ctx.now = 0
    this.ctx.duaActiveUntil = -1
  }

  spawnEnemy(enemyId: EnemyId, lane: number, wave: number): Enemy {
    const e = new Enemy(enemyId, this.enemyIdCounter++, lane, wave)
    this.enemies.push(e)
    this.group.add(e.group)
    return e
  }

  get aliveEnemyCount() {
    return this.enemies.filter((e) => !e.dead && !e.leaked && !e.escaped).length
  }

  towerAtSlot(slotIndex: number): Tower | null {
    return this.towers.find((t) => t.slotIndex === slotIndex) ?? null
  }

  placeTower(charId: CharId, slotIndex: number, x: number, z: number, cost: number): Tower {
    const tower = new Tower(charId, slotIndex, x, z, cost)
    this.towers.push(tower)
    this.group.add(tower.group)
    this.group.add(tower.rangeRing)
    this.group.add(tower.duaGlow)
    return tower
  }

  removeTower(tower: Tower) {
    this.towers = this.towers.filter((t) => t !== tower)
    this.group.remove(tower.group)
    this.group.remove(tower.rangeRing)
    this.group.remove(tower.duaGlow)
  }

  private spawnProjectile(kind: ProjKind, tower: Tower, target: Enemy, damage: number) {
    const pool = this.projPool[kind]
    let p = pool.find((x) => !x.alive)
    if (!p) {
      p = new Projectile(kind, tower)
      this.projectiles.push(p)
    }
    p.owner = tower
    p.damage = damage
    p.target = target
    p.alive = true
    p.t = 0
    p.from.set(tower.pos.x, 1.4, tower.pos.z)
    p.targetPos.copy(target.pos).setY(0.9)
    p.mesh.position.copy(p.from)
    p.dur = kind === 'orb' ? Math.max(0.12, tower.pos.distanceTo(target.pos) / 22) : kind === 'bubble' ? Math.max(0.2, tower.pos.distanceTo(target.pos) / 13) : 0.6
    if (kind === 'bubble') {
      p.aoeRadius = tower.def.aoeRadius![tower.level - 1]
      p.slowDur = tower.def.slowDuration![tower.level - 1]
    }
    if (kind === 'coin') {
      p.aoeRadius = tower.def.aoeRadius![tower.level - 1]
      p.knockback = tower.def.knockback ?? 0
    }
    this.group.add(p.mesh)
  }

  update(dt: number) {
    this.ctx.now += dt

    // update enemies
    for (const e of this.enemies) {
      if (e.dead || e.leaked || e.escaped) continue
      e.update(dt, this.ctx, this.enemies)
    }

    // update towers
    for (const t of this.towers) {
      t.update(dt, this.ctx, this.enemies)
    }

    // update projectiles
    for (const p of this.projectiles) {
      if (!p.alive) continue
      p.t += dt / p.dur
      if (p.target && !p.target.dead && !p.target.leaked && !p.target.escaped) {
        p.targetPos.copy(p.target.pos).setY(0.9)
      }
      const t = Math.min(1, p.t)
      if (p.kind === 'coin') {
        // lemparan melengkung lucu
        const y = p.from.y + (p.targetPos.y - p.from.y) * t + Math.sin(t * Math.PI) * 3.2
        p.mesh.position.lerpVectors(p.from, p.targetPos, t)
        p.mesh.position.y = y
        p.mesh.rotation.x += dt * 12
        p.mesh.rotation.z += dt * 7
        this.ctx.particles.trail(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 0xffd76a)
      } else {
        // homing dengan lengkung lembut
        const y = p.from.y + (p.targetPos.y - p.from.y) * t + Math.sin(t * Math.PI) * (p.kind === 'bubble' ? 1.4 : 0.5)
        p.mesh.position.lerpVectors(p.from, p.targetPos, t)
        p.mesh.position.y = y
        if (p.kind === 'bubble') {
          p.mesh.scale.setScalar(1 + Math.sin(t * Math.PI * 3) * 0.12)
        }
        if (Math.random() < 0.5) {
          this.ctx.particles.trail(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, p.kind === 'orb' ? 0xfff1b8 : 0xcde8ff)
        }
      }
      if (t >= 1) {
        this.projectileHit(p)
      }
    }

    // bersihkan enemy mati
    if (this.enemies.some((e) => e.dead || e.leaked || e.escaped)) {
      this.enemies = this.enemies.filter((e) => {
        if (e.dead || e.leaked || e.escaped) {
          e.dispose(this.group)
          return false
        }
        return true
      })
    }
  }

  private projectileHit(p: Projectile) {
    p.alive = false
    this.group.remove(p.mesh)
    const pos = p.targetPos

    if (p.kind === 'orb') {
      this.ctx.particles.hitBurst(pos.x, pos.y, pos.z)
      if (p.target && !p.target.dead && !p.target.leaked && !p.target.escaped) {
        p.target.takeDamage(p.damage, this.ctx)
      }
    } else if (p.kind === 'bubble') {
      // gelembung dzikir meletus → AoE kliyengan
      audio.bubble()
      this.ctx.particles.bubblePop(pos.x, pos.y, pos.z)
      this.enemies.forEach((e) => {
        if (e.dead || e.leaked || e.escaped) return
        if (e.pos.distanceTo(pos) <= p.aoeRadius + 0.6) {
          e.takeDamage(p.damage, this.ctx, { slow: { factor: 0.55, duration: p.slowDur } })
        }
      })
    } else if (p.kind === 'coin') {
      // koin sedekah → splash + knockback
      this.ctx.particles.hitBurst(pos.x, 0.4, pos.z, 0xffd76a)
      this.ctx.particles.rings.spawn(pos.x, 0.08, pos.z, 0xffd76a, p.aoeRadius, 0.5)
      audio.hit()
      this.enemies.forEach((e) => {
        if (e.dead || e.leaked || e.escaped) return
        if (e.pos.distanceTo(pos) <= p.aoeRadius + 0.6) {
          e.takeDamage(p.damage, this.ctx, { knockback: p.knockback })
        }
      })
    }
  }
}
