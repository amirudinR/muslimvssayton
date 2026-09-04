/* ============================================================
 * PENJAGA MASJID — VFX Particles (pooling, Points-based).
 * 4 pool point-cloud (glow, cloud, star, confetti) + ring FX
 * + damage numbers — semuanya reusable, tanpa alokasi per frame.
 * ============================================================ */

import * as THREE from 'three'

interface ParticleData {
  alive: boolean
  vx: number
  vy: number
  vz: number
  gravity: number
  drag: number
  life: number
  maxLife: number
  sizeStart: number
  sizeEnd: number
  fadeIn: boolean
  opacity: number
}

const MAX_PER_POOL = 320

function makeTexture(kind: 'soft' | 'star' | 'square'): THREE.CanvasTexture {
  const size = 64
  const cvs = document.createElement('canvas')
  cvs.width = size
  cvs.height = size
  const ctx = cvs.getContext('2d')!
  if (kind === 'soft') {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.45, 'rgba(255,255,255,0.55)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  } else if (kind === 'star') {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 30 : 13
      const x = 32 + Math.cos(ang) * r
      const y = 32 + Math.sin(ang) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = '#fff'
    ctx.fillRect(14, 14, 36, 36)
  }
  const tex = new THREE.CanvasTexture(cvs)
  return tex
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vColor = aColor;
    vOpacity = aOpacity;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (240.0 / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vOpacity);
    if (gl_FragColor.a < 0.01) discard;
  }
`

class ParticlePool {
  points: THREE.Points
  private data: ParticleData[] = []
  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private opacities: Float32Array
  private cursor = 0

  constructor(kind: 'soft' | 'star' | 'square', additive: boolean) {
    const tex = makeTexture(kind)
    const geo = new THREE.BufferGeometry()
    this.positions = new Float32Array(MAX_PER_POOL * 3)
    this.colors = new Float32Array(MAX_PER_POOL * 3)
    this.sizes = new Float32Array(MAX_PER_POOL)
    this.opacities = new Float32Array(MAX_PER_POOL)
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    for (let i = 0; i < MAX_PER_POOL; i++) {
      this.data.push({
        alive: false, vx: 0, vy: 0, vz: 0, gravity: 0, drag: 1,
        life: 0, maxLife: 1, sizeStart: 1, sizeEnd: 1, fadeIn: false,
      })
      this.sizes[i] = 0
      this.opacities[i] = 0
    }
  }

  spawn(
    x: number, y: number, z: number,
    color: THREE.Color,
    opt: { vx: number; vy: number; vz: number; life: number; sizeStart: number; sizeEnd: number; gravity?: number; drag?: number; opacity?: number; fadeIn?: boolean },
  ) {
    // round-robin: timpa partikel tertua bila penuh
    let idx = -1
    for (let i = 0; i < MAX_PER_POOL; i++) {
      const j = (this.cursor + i) % MAX_PER_POOL
      if (!this.data[j].alive) {
        idx = j
        this.cursor = (j + 1) % MAX_PER_POOL
        break
      }
    }
    if (idx < 0) {
      idx = this.cursor
      this.cursor = (this.cursor + 1) % MAX_PER_POOL
    }
    const d = this.data[idx]
    d.alive = true
    d.vx = opt.vx
    d.vy = opt.vy
    d.vz = opt.vz
    d.gravity = opt.gravity ?? 0
    d.drag = opt.drag ?? 1
    d.life = 0
    d.maxLife = opt.life
    d.sizeStart = opt.sizeStart
    d.sizeEnd = opt.sizeEnd
    d.fadeIn = opt.fadeIn ?? false
    d.opacity = opt.opacity ?? 1
    this.positions[idx * 3] = x
    this.positions[idx * 3 + 1] = y
    this.positions[idx * 3 + 2] = z
    this.colors[idx * 3] = color.r
    this.colors[idx * 3 + 1] = color.g
    this.colors[idx * 3 + 2] = color.b
    this.sizes[idx] = opt.sizeStart
    this.opacities[idx] = opt.fadeIn ? 0 : (opt.opacity ?? 1)
  }

  update(dt: number) {
    let any = false
    for (let i = 0; i < MAX_PER_POOL; i++) {
      const d = this.data[i]
      if (!d.alive) continue
      any = true
      d.life += dt
      if (d.life >= d.maxLife) {
        d.alive = false
        this.sizes[i] = 0
        this.opacities[i] = 0
        continue
      }
      const t = d.life / d.maxLife
      d.vy -= d.gravity * dt
      const dr = Math.pow(d.drag, dt * 60)
      d.vx *= dr
      d.vy *= dr
      d.vz *= dr
      this.positions[i * 3] += d.vx * dt
      this.positions[i * 3 + 1] += d.vy * dt
      this.positions[i * 3 + 2] += d.vz * dt
      const size = d.sizeStart + (d.sizeEnd - d.sizeStart) * t
      this.sizes[i] = size
      let op = d.opacity ?? 1
      if (d.fadeIn && t < 0.15) op *= t / 0.15
      op *= 1 - t * t
      this.opacities[i] = Math.max(0, op)
    }
    if (any) {
      ;(this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(this.points.geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true
      ;(this.points.geometry.getAttribute('aOpacity') as THREE.BufferAttribute).needsUpdate = true
      ;(this.points.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true
    }
  }
}

/* --------------------------- Ring FX (gelombang) --------------------------- */

interface RingData {
  alive: boolean
  life: number
  maxLife: number
  r0: number
  r1: number
}

class RingPool {
  group = new THREE.Group()
  private rings: THREE.Mesh[] = []
  private data: RingData[] = []
  private cursor = 0
  private MAX = 24

  constructor() {
    const geo = new THREE.RingGeometry(0.86, 1.0, 48)
    for (let i = 0; i < this.MAX; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
      const m = new THREE.Mesh(geo, mat)
      m.rotation.x = -Math.PI / 2
      m.visible = false
      this.group.add(m)
      this.rings.push(m)
      this.data.push({ alive: false, life: 0, maxLife: 1, r0: 1, r1: 2 })
    }
  }

  spawn(x: number, y: number, z: number, color: number, r1: number, life = 0.6, r0 = 0.4) {
    const idx = this.cursor % this.MAX
    this.cursor++
    const m = this.rings[idx]
    const d = this.data[idx]
    d.alive = true
    d.life = 0
    d.maxLife = life
    d.r0 = r0
    d.r1 = r1
    m.visible = true
    m.position.set(x, y, z)
    ;(m.material as THREE.MeshBasicMaterial).color.setHex(color)
    m.scale.setScalar(r0)
  }

  update(dt: number) {
    for (let i = 0; i < this.MAX; i++) {
      const d = this.data[i]
      if (!d.alive) continue
      d.life += dt
      const t = d.life / d.maxLife
      if (t >= 1) {
        d.alive = false
        this.rings[i].visible = false
        continue
      }
      const r = d.r0 + (d.r1 - d.r0) * (1 - Math.pow(1 - t, 2))
      this.rings[i].scale.setScalar(r)
      ;(this.rings[i].material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t)
    }
  }
}

/* ----------------------------- Damage numbers ----------------------------- */

interface DmgData {
  alive: boolean
  life: number
  maxLife: number
}

class DamageNumberPool {
  group = new THREE.Group()
  private sprites: THREE.Sprite[] = []
  private canvas: HTMLCanvasElement[] = []
  private textures: THREE.CanvasTexture[] = []
  private data: DmgData[] = []
  private cursor = 0
  private MAX = 22

  constructor() {
    for (let i = 0; i < this.MAX; i++) {
      const cvs = document.createElement('canvas')
      cvs.width = 192
      cvs.height = 96
      const tex = new THREE.CanvasTexture(cvs)
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      const sp = new THREE.Sprite(mat)
      sp.visible = false
      sp.scale.set(2.4, 1.2, 1)
      this.group.add(sp)
      this.sprites.push(sp)
      this.canvas.push(cvs)
      this.textures.push(tex)
      this.data.push({ alive: false, life: 0, maxLife: 0.95 })
    }
  }

  show(x: number, y: number, z: number, text: string, color = '#ff8c42', big = false) {
    const idx = this.cursor % this.MAX
    this.cursor++
    const cvs = this.canvas[idx]
    const ctx = cvs.getContext('2d')!
    ctx.clearRect(0, 0, 192, 96)
    ctx.font = `700 ${big ? 58 : 44}px "Baloo 2", "Fredoka", "Comic Sans MS", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 10
    ctx.strokeStyle = '#ffffff'
    ctx.strokeText(text, 96, 50)
    ctx.fillStyle = color
    ctx.fillText(text, 96, 50)
    this.textures[idx].needsUpdate = true
    const sp = this.sprites[idx]
    sp.visible = true
    sp.position.set(x, y, z)
    sp.scale.set(big ? 3.4 : 2.4, big ? 1.7 : 1.2, 1)
    const d = this.data[idx]
    d.alive = true
    d.life = 0
  }

  update(dt: number) {
    for (let i = 0; i < this.MAX; i++) {
      const d = this.data[i]
      if (!d.alive) continue
      d.life += dt
      const t = d.life / d.maxLife
      if (t >= 1) {
        d.alive = false
        this.sprites[i].visible = false
        continue
      }
      const sp = this.sprites[i]
      sp.position.y += dt * 2.2
      const pop = t < 0.2 ? 1 + (1 - t / 0.2) * 0.35 : 1
      const base = sp.scale.x > 3 ? 3.4 : 2.4
      sp.scale.set(base * pop, (base / 2) * pop, 1)
      ;(sp.material as THREE.SpriteMaterial).opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
    }
  }
}

/* ----------------------------- ParticleSystem ----------------------------- */

export class ParticleSystem {
  private glow: ParticlePool
  private cloud: ParticlePool
  private star: ParticlePool
  private confetti: ParticlePool
  rings = new RingPool()
  damage = new DamageNumberPool()
  group = new THREE.Group()

  private tmpColor = new THREE.Color()

  constructor() {
    this.glow = new ParticlePool('soft', true)
    this.cloud = new ParticlePool('soft', false)
    this.star = new ParticlePool('star', true)
    this.confetti = new ParticlePool('square', false)
    this.group.add(this.glow.points, this.cloud.points, this.star.points, this.confetti.points, this.rings.group, this.damage.group)
  }

  update(dt: number) {
    this.glow.update(dt)
    this.cloud.update(dt)
    this.star.update(dt)
    this.confetti.update(dt)
    this.rings.update(dt)
    this.damage.update(dt)
  }

  /* ---------- komposit efek ceria ---------- */

  muzzle(x: number, y: number, z: number, color = 0xffd76a) {
    this.tmpColor.setHex(color)
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 1.5 + Math.random() * 2
      this.glow.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 1 + Math.random() * 2, vz: Math.sin(a) * s,
        life: 0.4, sizeStart: 0.5, sizeEnd: 0.1, drag: 0.9,
      })
    }
  }

  hitBurst(x: number, y: number, z: number, color = 0xffe9a8) {
    this.tmpColor.setHex(color)
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 3
      this.glow.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: Math.random() * 3.5, vz: Math.sin(a) * s,
        life: 0.45, sizeStart: 0.55, sizeEnd: 0.12, drag: 0.88,
      })
    }
    this.tmpColor.setHex(0xfff6c8)
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2
      this.star.spawn(x, y + 0.3, z, this.tmpColor, {
        vx: Math.cos(a) * 2, vy: 2.5 + Math.random() * 2, vz: Math.sin(a) * 2,
        life: 0.7, sizeStart: 0.5, sizeEnd: 0.2, gravity: 6,
      })
    }
  }

  deathPoof(x: number, y: number, z: number) {
    // asap ungu lucu (awan kartun)
    this.tmpColor.setHex(0xc39bff)
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 1 + Math.random() * 1.6
      this.cloud.spawn(x, y + 0.4 + Math.random() * 0.5, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 1.2 + Math.random(), vz: Math.sin(a) * s,
        life: 0.75, sizeStart: 0.7, sizeEnd: 2.1, drag: 0.92, opacity: 0.85, fadeIn: true,
      })
    }
    // confetti warna-warni
    const colors = [0xff9ecb, 0xffd166, 0x9ff2c8, 0xa8e6ff, 0xff8f6b]
    for (let i = 0; i < 10; i++) {
      this.tmpColor.setHex(colors[i % colors.length])
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 3
      this.confetti.spawn(x, y + 0.8, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 4 + Math.random() * 4, vz: Math.sin(a) * s,
        life: 1.0, sizeStart: 0.35, sizeEnd: 0.2, gravity: 9, drag: 0.99,
      })
    }
    // bintang kecil naik
    this.tmpColor.setHex(0xffe066)
    for (let i = 0; i < 3; i++) {
      this.star.spawn(x, y + 0.6, z, this.tmpColor, {
        vx: (Math.random() - 0.5) * 2, vy: 3 + Math.random() * 2, vz: (Math.random() - 0.5) * 2,
        life: 0.9, sizeStart: 0.6, sizeEnd: 0.25, gravity: 2,
      })
    }
    this.rings.spawn(x, 0.08, z, 0xc39bff, 2.2, 0.5)
  }

  bubblePop(x: number, y: number, z: number) {
    this.rings.spawn(x, 0.08, z, 0xd0ecff, 3.2, 0.55)
    this.tmpColor.setHex(0xffffff)
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 2
      this.cloud.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: Math.random() * 2, vz: Math.sin(a) * s,
        life: 0.4, sizeStart: 0.35, sizeEnd: 0.9, drag: 0.9,
      })
    }
  }

  slowPulse(x: number, y: number, z: number, radius: number) {
    this.rings.spawn(x, 0.08, z, 0xff9ecb, radius, 0.8)
    this.tmpColor.setHex(0xffb7d5)
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2
      const rr = Math.random() * radius
      this.cloud.spawn(x + Math.cos(a) * rr, y + 0.2 + Math.random(), z + Math.sin(a) * rr, this.tmpColor, {
        vx: 0, vy: 0.8, vz: 0,
        life: 0.8, sizeStart: 0.4, sizeEnd: 0.15, fadeIn: true,
      })
    }
  }

  levelUp(x: number, y: number, z: number) {
    this.rings.spawn(x, 0.08, z, 0xffd76a, 4, 0.8)
    this.tmpColor.setHex(0xffd76a)
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 3 + Math.random() * 3
      this.glow.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 5 + Math.random() * 5, vz: Math.sin(a) * s,
        life: 0.9, sizeStart: 0.6, sizeEnd: 0.15, gravity: 5, drag: 0.94,
      })
    }
    const colors = [0xff9ecb, 0xffd166, 0x9ff2c8, 0xa8e6ff]
    for (let i = 0; i < 18; i++) {
      this.tmpColor.setHex(colors[i % colors.length])
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 4
      this.confetti.spawn(x, y + 1.5, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 7 + Math.random() * 5, vz: Math.sin(a) * s,
        life: 1.3, sizeStart: 0.4, sizeEnd: 0.22, gravity: 9,
      })
    }
  }

  adzanWave(x: number, y: number, z: number) {
    this.rings.spawn(x, 0.1, z, 0xfff1b8, 46, 1.1, 0.5)
    this.tmpColor.setHex(0xffe9a8)
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 4 + Math.random() * 6
      this.glow.spawn(x, y + 1, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 3 + Math.random() * 4, vz: Math.sin(a) * s,
        life: 1.0, sizeStart: 0.7, sizeEnd: 0.2, drag: 0.93,
      })
    }
  }

  firework(x: number, y: number, z: number, color = 0xff9ecb) {
    this.tmpColor.setHex(color)
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2
      const b = Math.random() * Math.PI
      const s = 6 + Math.random() * 6
      this.star.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * Math.sin(b) * s, vy: Math.cos(b) * s, vz: Math.sin(a) * Math.sin(b) * s,
        life: 1.4, sizeStart: 0.6, sizeEnd: 0.1, gravity: 4, drag: 0.97,
      })
    }
    this.rings.spawn(x, y, z, color, 6, 0.7, 0.2)
  }

  trail(x: number, y: number, z: number, color = 0xffd76a) {
    this.tmpColor.setHex(color)
    this.glow.spawn(x, y, z, this.tmpColor, {
      vx: 0, vy: 0.3, vz: 0, life: 0.35, sizeStart: 0.5, sizeEnd: 0.05,
    })
  }

  smokePuff(x: number, y: number, z: number, color = 0xc39bff) {
    this.tmpColor.setHex(color)
    this.cloud.spawn(x, y, z, this.tmpColor, {
      vx: (Math.random() - 0.5), vy: 1.2 + Math.random(), vz: (Math.random() - 0.5),
      life: 1.0, sizeStart: 0.4, sizeEnd: 1.2, opacity: 0.6, fadeIn: true,
    })
  }

  sparkleRise(x: number, y: number, z: number, color = 0xffe9a8) {
    this.tmpColor.setHex(color)
    this.glow.spawn(x, y, z, this.tmpColor, {
      vx: (Math.random() - 0.5) * 0.6, vy: 0.8 + Math.random() * 1.2, vz: (Math.random() - 0.5) * 0.6,
      life: 2.2, sizeStart: 0.35, sizeEnd: 0.1, fadeIn: true,
    })
  }

  stealFx(x: number, y: number, z: number) {
    this.tmpColor.setHex(0xffd76a)
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 2
      this.confetti.spawn(x, y, z, this.tmpColor, {
        vx: Math.cos(a) * s, vy: 3 + Math.random() * 3, vz: Math.sin(a) * s,
        life: 0.8, sizeStart: 0.3, sizeEnd: 0.15, gravity: 8,
      })
    }
  }

  showDamage(x: number, y: number, z: number, amount: number, color?: string, big?: boolean) {
    this.damage.show(x, y, z, `-${Math.round(amount)}`, color ?? '#ff8c42', big)
  }

  showPahala(x: number, y: number, z: number, amount: number) {
    this.damage.show(x, y, z, `+${amount}`, '#2ea36a')
  }
}
