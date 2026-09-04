/* ============================================================
 * PENJAGA MASJID — Model 3D prosedural (chibi / low-poly cute).
 * Semua model dibangun dari primitif Three.js, di-cache sebagai
 * template lalu di-clone agar geometri & material dipakai ulang.
 * ============================================================ */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CHAR_DEFS, ENEMY_DEFS, LANES } from './data'
import type { CharId, EnemyId } from './data'

/* ------------------------------ Helpers ------------------------------ */

const std = (color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o })

const basic = (color: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) =>
  new THREE.MeshBasicMaterial({ color, ...o })

function colorGeo<T extends THREE.BufferGeometry>(g: T, hex: number): T {
  const c = new THREE.Color(hex)
  const n = g.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r
    arr[i * 3 + 1] = c.g
    arr[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
  }
  return g
}

const disposables: THREE.Texture[] = []
export function disposeSharedModels() {
  disposables.forEach((t) => t.dispose())
  disposables.length = 0
}

/* ------------------------------ Ground ------------------------------ */

export function createGroundTexture(): THREE.CanvasTexture {
  const W = 1536
  const H = 972
  const cvs = document.createElement('canvas')
  cvs.width = W
  cvs.height = H
  const ctx = cvs.getContext('2d')!
  const toX = (x: number) => ((x + 38) / 76) * W
  const toY = (z: number) => ((z + 24) / 48) * H

  // Rumput cerah
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#8fd465')
  grad.addColorStop(0.5, '#84cd5c')
  grad.addColorStop(1, '#79c455')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Bercak rumput lembut
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(154, 224, 106, 0.35)' : 'rgba(113, 197, 84, 0.3)'
    const rx = Math.random() * W
    const ry = Math.random() * H
    const rw = 60 + Math.random() * 160
    const rh = 30 + Math.random() * 80
    ctx.beginPath()
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Halaman masjid (batu hangat)
  ctx.fillStyle = '#f4e9cd'
  ctx.beginPath()
  ctx.ellipse(toX(0), toY(0), 15.5 * (W / 76), 13.5 * (H / 48), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ddc99a'
  ctx.lineWidth = 14
  ctx.stroke()

  // Pola batu halaman
  ctx.strokeStyle = 'rgba(210, 190, 140, 0.5)'
  ctx.lineWidth = 3
  for (let r = 4; r < 14; r += 3.2) {
    ctx.beginPath()
    ctx.ellipse(toX(0), toY(0), r * (W / 76), r * (H / 48), 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Jalur setan (tan lembut) — dua layer stroke untuk tepi
  const drawLane = (width: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    LANES.forEach((lane) => {
      ctx.beginPath()
      const pts = lane.map(([x, z]) => [toX(x), toY(z)] as [number, number])
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2
        const my = (pts[i][1] + pts[i + 1][1]) / 2
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
      ctx.stroke()
    })
  }
  const pxPerUnit = W / 76
  drawLane(3.1 * pxPerUnit, '#d9bd8f')
  drawLane(2.5 * pxPerUnit, '#ecd9a9')

  // Bintik bunga kecil di rumput
  const flowerColors = ['#ff9ecb', '#ffd166', '#fff5f0', '#c39bff', '#ff8f6b']
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = flowerColors[i % flowerColors.length]
    const rx = Math.random() * W
    const ry = Math.random() * H
    ctx.beginPath()
    ctx.arc(rx, ry, 3 + Math.random() * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(cvs)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function createGround(): THREE.Mesh {
  const tex = createGroundTexture()
  disposables.push(tex)
  const geo = new THREE.PlaneGeometry(76, 48)
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  mesh.name = 'ground'
  return mesh
}

/* ------------------------------ Masjid ------------------------------ */

export interface MosqueParts {
  domeLight: THREE.PointLight
  lanterns: THREE.Mesh[]
}

export function createMosque(): { group: THREE.Group; parts: MosqueParts } {
  const group = new THREE.Group()

  const cream = std(0xfffaf0, { roughness: 0.65 })
  const mint = std(0x8fd6b4, { roughness: 0.7 })
  const gold = new THREE.MeshStandardMaterial({
    color: 0xf7c948,
    metalness: 0.9,
    roughness: 0.22,
  })
  const wood = std(0x6b4226, { roughness: 0.85 })
  const stone = std(0xf0e2c4, { roughness: 0.9 })

  // Platform
  const platform = new THREE.Mesh(new THREE.BoxGeometry(17, 0.8, 15), stone)
  platform.position.y = 0.4
  platform.receiveShadow = true
  platform.castShadow = true
  group.add(platform)

  // Tangga depan
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 1.4), stone)
  step1.position.set(0, 0.18, 7.9)
  group.add(step1)
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 1.0), stone)
  step2.position.set(0, 0.5, 7.3)
  group.add(step2)

  // Bangunan utama
  const hall = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 9), cream)
  hall.position.y = 0.8 + 2.75
  hall.castShadow = true
  hall.receiveShadow = true
  group.add(hall)

  // Pilaster mint di sudut
  const pilGeo = new THREE.BoxGeometry(0.7, 5.5, 0.7)
  const corners: [number, number][] = [
    [-5.2, 4.2],
    [5.2, 4.2],
    [-5.2, -4.2],
    [5.2, -4.2],
  ]
  corners.forEach(([x, z]) => {
    const p = new THREE.Mesh(pilGeo, mint)
    p.position.set(x, 3.55, z)
    group.add(p)
  })

  // Pintu lengkung + bingkai emas
  const archShape = (w: number, h: number) => {
    const s = new THREE.Shape()
    const r = w / 2
    s.moveTo(-r, 0)
    s.lineTo(-r, h - r)
    s.absarc(0, h - r, r, Math.PI, 0, true)
    s.lineTo(r, 0)
    s.lineTo(-r, 0)
    return s
  }
  const doorFrame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(archShape(3.1, 4.4), { depth: 0.18, bevelEnabled: false }),
    gold,
  )
  doorFrame.position.set(0, 0.82, 4.42)
  group.add(doorFrame)
  const door = new THREE.Mesh(
    new THREE.ExtrudeGeometry(archShape(2.5, 3.9), { depth: 0.2, bevelEnabled: false }),
    wood,
  )
  door.position.set(0, 0.82, 4.55)
  group.add(door)
  // Gagang pintu
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), gold)
  knob.position.set(0.9, 2.6, 4.85)
  group.add(knob)

  // Jendela lengkung hangat (emissive)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffe6a3,
    emissive: 0xffc85e,
    emissiveIntensity: 0.85,
    roughness: 0.4,
  })
  const winGeo = new THREE.ExtrudeGeometry(archShape(1.15, 1.9), { depth: 0.1, bevelEnabled: false })
  const winPos: [number, number, number][] = [
    [-3.4, 2.6, 4.48],
    [3.4, 2.6, 4.48],
    [-5.56, 2.6, 1.5],
    [-5.56, 2.6, -1.5],
    [5.56, 2.6, 1.5],
    [5.56, 2.6, -1.5],
  ]
  winPos.forEach(([x, y, z]) => {
    const wmesh = new THREE.Mesh(winGeo, winMat)
    wmesh.position.set(x, y, z)
    if (Math.abs(x) > 5.5) wmesh.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2
    group.add(wmesh)
  })

  // Drum kubah + kubah emas besar
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 1.1, 24), mint)
  drum.position.y = 6.9
  group.add(drum)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.8, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), gold)
  dome.position.y = 7.4
  dome.castShadow = true
  group.add(dome)

  // Finial: tiang + bulan sabit + bola
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.3, 8), gold)
  rod.position.y = 11.6
  group.add(rod)
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 8, 24, Math.PI * 1.25), gold)
  crescent.position.y = 12.5
  crescent.rotation.z = Math.PI * 0.62
  group.add(crescent)
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), gold)
  orb.position.y = 12.15
  group.add(orb)

  // Menara depan kiri-kanan
  const minaret = (mx: number) => {
    const m = new THREE.Group()
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 1.7), stone)
    base.position.y = 0.45
    m.add(base)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 6.4, 14), cream)
    shaft.position.y = 4.1
    shaft.castShadow = true
    m.add(shaft)
    const balcony = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.14, 8, 18), mint)
    balcony.rotation.x = Math.PI / 2
    balcony.position.y = 6.6
    m.add(balcony)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.5, 14), mint)
    cap.position.y = 7.0
    m.add(cap)
    const smallDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold)
    smallDome.position.y = 7.25
    m.add(smallDome)
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), gold)
    tip.position.y = 8.2
    m.add(tip)
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), gold)
    star.position.y = 8.75
    m.add(star)
    m.position.set(mx, 0, 6.6)
    return m
  }
  const minL = minaret(-6.9)
  const minR = minaret(6.9)
  group.add(minL, minR)

  // Lampu hias gantung (kurva dari menara ke kubah) — emissive untuk bloom
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffe1a0,
    emissive: 0xffc65e,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  })
  const lanterns: THREE.Mesh[] = []
  const strands: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-6.9, 8.4, 6.6), new THREE.Vector3(-3.4, 9.4, 2.2)],
    [new THREE.Vector3(6.9, 8.4, 6.6), new THREE.Vector3(3.4, 9.4, 2.2)],
  ]
  strands.forEach(([a, b]) => {
    const mid = a.clone().lerp(b, 0.5)
    mid.y += 1.1
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    const pts = curve.getPoints(7)
    pts.slice(1, -1).forEach((p) => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat)
      l.position.copy(p)
      l.userData.baseY = p.y
      group.add(l)
      lanterns.push(l)
    })
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),
      new THREE.LineBasicMaterial({ color: 0xa07840 }),
    )
    group.add(line)
  })

  // Cahaya hangat dari kubah
  const domeLight = new THREE.PointLight(0xffd98a, 30, 26, 1.8)
  domeLight.position.set(0, 9.2, 0)
  group.add(domeLight)

  // Air mancur kecil di halaman depan
  const fountain = new THREE.Group()
  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.7, 18), stone)
  fBase.position.y = 0.35
  fountain.add(fBase)
  const fWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.28, 0.18, 18),
    new THREE.MeshStandardMaterial({ color: 0x7fd4e8, transparent: true, opacity: 0.85, roughness: 0.2 }),
  )
  fWater.position.y = 0.68
  fountain.add(fWater)
  const fSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 10), mint)
  fSpout.position.y = 1.1
  fountain.add(fSpout)
  const fTop = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), std(0x8fd6b4))
  fTop.position.y = 1.75
  fountain.add(fTop)
  fountain.position.set(0, 0, 10.4)
  group.add(fountain)

  return { group, parts: { domeLight, lanterns } }
}

/* ------------------------------ Alam sekitar ------------------------------ */

const TREE_COLORS = [0x63b94e, 0x74c95a, 0x54a648]

export function createTree(scale = 1): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 1.4, 8),
    std(0x8a5a2b, { roughness: 1 }),
  )
  trunk.position.y = 0.7
  trunk.castShadow = true
  g.add(trunk)
  const c1 = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)]
  const c2 = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)]
  const leafGeo = new THREE.SphereGeometry(0.95, 10, 8)
  const l1 = new THREE.Mesh(leafGeo, std(c1, { flatShading: true, roughness: 0.9 }))
  l1.position.y = 1.9
  l1.castShadow = true
  const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), std(c2, { flatShading: true, roughness: 0.9 }))
  l2.position.set(0.45, 2.55, 0.18)
  l2.castShadow = true
  const l3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), std(c1, { flatShading: true, roughness: 0.9 }))
  l3.position.set(-0.4, 2.35, -0.25)
  l3.castShadow = true
  g.add(l1, l2, l3)
  g.scale.setScalar(scale)
  return g
}

/** Bunga 3D digabung jadi satu geometri bervertex-color (hemis draw call). */
export function createFlowerField(count = 46): THREE.Mesh {
  const geos: THREE.BufferGeometry[] = []
  const petalColors = [0xff9ecb, 0xffd166, 0xfff5f0, 0xc39bff, 0xff8f6b, 0xa8e6ff]
  for (let i = 0; i < count; i++) {
    const fx = (Math.random() - 0.5) * 72
    const fz = (Math.random() - 0.5) * 44
    // hindari area jalur & halaman masjid kasar
    if (Math.abs(fx) < 11 && Math.abs(fz) < 10) continue
    const y = 0.14
    const stem = colorGeo(
      new THREE.CylinderGeometry(0.035, 0.05, 0.32, 5).translate(fx, y, fz),
      0x3f9b45,
    )
    geos.push(stem)
    const pc = petalColors[Math.floor(Math.random() * petalColors.length)]
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2
      const petal = colorGeo(
        new THREE.SphereGeometry(0.11, 6, 5).translate(fx + Math.cos(ang) * 0.15, y + 0.34, fz + Math.sin(ang) * 0.15),
        pc,
      )
      geos.push(petal)
    }
    const center = colorGeo(new THREE.SphereGeometry(0.09, 6, 5).translate(fx, y + 0.36, fz), 0xffe066)
    geos.push(center)
  }
  const merged = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }))
  mesh.castShadow = false
  return mesh
}

export function createCloud(): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.96 })
  const r = () => 0.9 + Math.random() * 0.7
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r(), 10, 8), mat)
    s.position.set((i - 1.5) * 1.1 + (Math.random() - 0.5), (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.8)
    s.scale.y = 0.62
    g.add(s)
  }
  return g
}

export function createBird(): THREE.Group {
  const g = new THREE.Group()
  const mat = std(0xfff5e6, { flatShading: true, roughness: 0.9 })
  const wingGeo = new THREE.PlaneGeometry(0.55, 0.28)
  const wl = new THREE.Mesh(wingGeo, mat)
  const wr = new THREE.Mesh(wingGeo, mat)
  wl.position.x = -0.28
  wr.position.x = 0.28
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), std(0xffcf8a))
  body.scale.z = 1.5
  g.add(wl, wr, body)
  g.userData = { wl, wr }
  return g
}

export function createButterfly(): THREE.Group {
  const g = new THREE.Group()
  const colors = [0xff9ecb, 0xa8e6ff, 0xffd166, 0xc39bff]
  const col = colors[Math.floor(Math.random() * colors.length)]
  const mat = std(col, { side: THREE.DoubleSide, roughness: 0.6 })
  const wingGeo = new THREE.CircleGeometry(0.22, 8)
  const wl = new THREE.Mesh(wingGeo, mat)
  const wr = new THREE.Mesh(wingGeo, mat)
  wl.position.x = -0.2
  wr.position.x = 0.2
  wl.rotation.y = Math.PI / 2
  wr.rotation.y = Math.PI / 2
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 3, 6), std(0x5a4632))
  body.rotation.x = Math.PI / 2
  g.add(wl, wr, body)
  g.userData = { wl, wr }
  return g
}

/* --------------------- Resolusi parts setelah clone --------------------- */
/* Object3D.clone() melakukan JSON round-trip pada userData, sehingga
 * referensi Object3D menjadi objek polos. Karena itu bagian penting
 * diberi .name, lalu di-resolve ulang pada hasil clone. */

function collectNamed(root: THREE.Object3D): Record<string, THREE.Object3D> {
  const found: Record<string, THREE.Object3D> = {}
  root.traverse((o) => {
    if (o.name && !found[o.name]) found[o.name] = o
  })
  return found
}

function collectListed(root: THREE.Object3D, name: string): THREE.Object3D[] {
  const list: THREE.Object3D[] = []
  root.traverse((o) => {
    if (o.name === name) list.push(o)
  })
  return list
}

/* ------------------------------ Slot pad ------------------------------ */

export function createSlotPad(): { group: THREE.Group; pad: THREE.Mesh; ring: THREE.Mesh } {
  const group = new THREE.Group()
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xcdeba4,
    roughness: 0.7,
    emissive: 0x9be07a,
    emissiveIntensity: 0.12,
  })
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1.02, 24), padMat)
  pad.rotation.x = -Math.PI / 2
  pad.position.y = 0.03
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.09, 8, 28),
    new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: 0.5, emissive: 0xffc94d, emissiveIntensity: 0.35 }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.1
  group.add(pad, ring)
  return { group, pad, ring }
}

/* ---------------------------- Wajah chibi ---------------------------- */

interface FaceOpts {
  y?: number
  spread?: number
  eyeScale?: number
  closed?: boolean // mata mengantuk (pocong)
  angry?: boolean // alis ngambek (boss)
  smileScale?: number
  cheeks?: boolean
}

function addFace(head: THREE.Object3D, headR: number, o: FaceOpts = {}) {
  const {
    y = headR * 0.1,
    spread = headR * 0.42,
    eyeScale = 1,
    closed = false,
    angry = false,
    smileScale = 1,
    cheeks = true,
  } = o
  const whiteMat = std(0xffffff, { roughness: 0.35 })
  const blackMat = basic(0x35281e)
  const z = headR * 0.86

  for (const side of [-1, 1]) {
    const ex = side * spread
    if (closed) {
      // Mata terpejam mengantuk: lengkung tidur
      const lid = new THREE.Mesh(new THREE.TorusGeometry(0.085 * eyeScale, 0.022, 6, 10, Math.PI), blackMat)
      lid.position.set(ex, y, z)
      lid.rotation.z = Math.PI
      head.add(lid)
    } else {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1 * eyeScale, 10, 8), whiteMat)
      eye.position.set(ex, y, z)
      eye.scale.z = 0.55
      head.add(eye)
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05 * eyeScale, 8, 6), blackMat)
      pupil.position.set(ex, y - 0.01, z + 0.05 * eyeScale)
      pupil.scale.z = 0.4
      head.add(pupil)
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.02 * eyeScale, 6, 4), basic(0xffffff))
      spark.position.set(ex + 0.025 * eyeScale, y + 0.035 * eyeScale, z + 0.085 * eyeScale)
      head.add(spark)
    }
    if (angry) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.05), blackMat)
      brow.position.set(ex, y + 0.15, z)
      brow.rotation.z = side * -0.45
      head.add(brow)
    }
    if (cheeks) {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        std(0xffa8c0, { roughness: 1 }),
      )
      cheek.position.set(side * headR * 0.62, y - 0.12, headR * 0.7)
      cheek.scale.z = 0.3
      head.add(cheek)
    }
  }

  // Senyum
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.1 * smileScale, 0.026, 6, 12, Math.PI * 0.75),
    blackMat,
  )
  smile.position.set(0, y - 0.16, z - 0.02)
  smile.rotation.z = Math.PI + Math.PI * 0.12
  head.add(smile)
}

/* ------------------------- Karakter anak sholeh ------------------------- */

const charTemplateCache = new Map<string, THREE.Group>()

export interface ChibiParts {
  head: THREE.Object3D
  body: THREE.Object3D
  armL: THREE.Object3D
  armR: THREE.Object3D
  stars: THREE.Object3D[]
  glow: THREE.Mesh | null
}

function buildChibi(charId: CharId, level: number): THREE.Group {
  const def = CHAR_DEFS[charId]
  const g = new THREE.Group()

  // Pedestal
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 1.0, 0.24, 20),
    std(0xfff3d6, { roughness: 0.75 }),
  )
  ped.position.y = 0.12
  ped.receiveShadow = true
  g.add(ped)
  const pedRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.07, 8, 22),
    new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.5 }),
  )
  pedRing.rotation.x = Math.PI / 2
  pedRing.position.y = 0.24
  g.add(pedRing)

  const emissiveBoost = [0, 0.08, 0.18][level - 1]
  const robe = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: [0.85, 0.7, 0.55][level - 1],
    emissive: new THREE.Color(def.color).multiplyScalar(emissiveBoost),
    flatShading: false,
  })

  // Badan (jubah bulat)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 16), robe)
  body.name = 'body'
  body.position.y = 0.78
  body.scale.y = 1.18
  body.castShadow = true
  g.add(body)

  // Kaki kecil mengintip
  const footMat = std(def.skin, { roughness: 0.7 })
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), footMat)
    foot.position.set(s * 0.2, 0.22, 0.28)
    g.add(foot)
  }

  // Kepala besar
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), std(def.skin, { roughness: 0.65 }))
  head.name = 'head'
  head.position.y = 1.62
  head.castShadow = true
  g.add(head)
  addFace(head, 0.55, { y: 0.06, spread: 0.24, eyeScale: 1.15, smileScale: 1.1 })

  // Lengan
  const armGeo = new THREE.CapsuleGeometry(0.13, 0.34, 4, 8)
  const armMat = robe
  const armL = new THREE.Mesh(armGeo, armMat)
  armL.name = 'armL'
  armL.position.set(-0.55, 1.02, 0.05)
  armL.rotation.z = 0.5
  const armR = new THREE.Mesh(armGeo, armMat)
  armR.name = 'armR'
  armR.position.set(0.55, 1.02, 0.05)
  armR.rotation.z = -0.5
  g.add(armL, armR)
  // tangan
  for (const [arm, s] of [[armL, -1], [armR, 1]] as [THREE.Mesh, number][]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), footMat)
    hand.position.set(s * 0.68, 0.82, 0.05)
    g.add(hand)
  }

  /* --- Aksesori unik per karakter --- */
  if (charId === 'ali') {
    const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.2, 14), std(0x39304a, { roughness: 0.9 }))
    peci.position.y = 2.05
    g.add(peci)
    // tasbih di tangan kanan
    const beads = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 14), std(0xd9a25f))
    beads.position.set(0.68, 0.82, 0.1)
    g.add(beads)
  } else if (charId === 'aisyah' || charId === 'fatimah') {
    // Hijab: kerudung belakang + tepi wajah
    const hijabColor = charId === 'aisyah' ? 0xfff3c9 : 0xffd1e0
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      std(hijabColor, { roughness: 0.8 }),
    )
    hood.position.y = 1.66
    hood.rotation.x = Math.PI * 0.78 // menutup belakang kepala
    g.add(hood)
    const veil = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 18, 14, Math.PI * 0.72, Math.PI * 0.56, Math.PI * 0.25, Math.PI * 0.52),
      std(hijabColor, { roughness: 0.8 }),
    )
    veil.position.y = 1.62
    g.add(veil)
    // bunga di hijab
    const flower = new THREE.Group()
    const fMat = std(charId === 'aisyah' ? 0xff9ecb : 0xa8e6ff)
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), fMat)
      petal.position.set(Math.cos(ang) * 0.07, Math.sin(ang) * 0.07, 0)
      flower.add(petal)
    }
    flower.position.set(0.42, 1.95, 0.18)
    g.add(flower)
    if (charId === 'aisyah') {
      // buku doa di depan
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.08), std(0x2ea36a, { roughness: 0.6 }))
      book.position.set(0, 1.0, 0.55)
      book.rotation.x = -0.4
      g.add(book)
    } else {
      // botol parfum wangi
      const bottle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), std(0x7fd4e8, { roughness: 0.3 }))
      bottle.position.set(0.68, 0.98, 0.12)
      g.add(bottle)
    }
  } else if (charId === 'umar') {
    const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.2, 14), std(0xfdfdf6, { roughness: 0.8 }))
    peci.position.y = 2.05
    g.add(peci)
    // selempang sedekah
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 20), std(def.accent, { roughness: 0.8 }))
    sash.position.y = 0.95
    sash.rotation.x = Math.PI / 2
    sash.rotation.y = 0.5
    g.add(sash)
    // koin emas di tangan kanan terangkat
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.05, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd76a, metalness: 0.9, roughness: 0.25, emissive: 0xa67c1a, emissiveIntensity: 0.4 }),
    )
    coin.position.set(0.72, 1.05, 0.1)
    coin.rotation.x = Math.PI / 2
    g.add(coin)
  } else if (charId === 'kakek') {
    // turban
    const turban = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.17, 10, 20), std(0xfdfdf6, { roughness: 0.85 }))
    turban.position.y = 2.0
    turban.rotation.x = 0.25
    g.add(turban)
    const turbanTop = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), std(0xfdfdf6, { roughness: 0.85 }))
    turbanTop.position.y = 2.12
    g.add(turbanTop)
    // jenggot putih lembut
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), std(0xf2f0ea, { roughness: 1 }))
    beard.position.set(0, 1.36, 0.34)
    beard.scale.set(1, 1.25, 0.55)
    g.add(beard)
    // alis putih lebat
    for (const s of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.06), std(0xf2f0ea))
      brow.position.set(s * 0.24, 1.76, 0.48)
      g.add(brow)
    }
    // tongkat kayu dengan ujung emas
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.8, 8), std(0x8a5a2b))
    staff.position.set(0.78, 0.9, 0.1)
    g.add(staff)
    const staffTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshStandardMaterial({ color: 0xffd76a, metalness: 0.9, roughness: 0.2 }))
    staffTip.position.set(0.78, 1.85, 0.1)
    g.add(staffTip)
  }

  // Upgrade glow ring di kaki (level 2+)
  let glow: THREE.Mesh | null = null
  if (level >= 2) {
    glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.05, 8, 24),
      basic(level === 2 ? 0xffe9a8 : 0x9ff2c8),
    )
    glow.name = 'glow'
    glow.rotation.x = Math.PI / 2
    glow.position.y = 0.05
    g.add(glow)
  }

  // Bintang level di atas kepala
  const stars: THREE.Object3D[] = []
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffd76a,
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x8a6a10,
    emissiveIntensity: 0.6,
  })
  for (let i = 0; i < level; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), starMat)
    star.name = 'star'
    star.position.set((i - (level - 1) / 2) * 0.34, 2.45, 0)
    star.userData.baseY = 2.45
    g.add(star)
    stars.push(star)
  }

  g.scale.setScalar([1, 1.1, 1.2][level - 1])
  return g
}

export function getCharacterModel(charId: CharId, level: number): THREE.Group {
  const key = `${charId}:${level}`
  let tpl = charTemplateCache.get(key)
  if (!tpl) {
    tpl = buildChibi(charId, level)
    charTemplateCache.set(key, tpl)
  }
  const clone = tpl.clone(true)
  const named = collectNamed(clone)
  const parts: ChibiParts = {
    head: named.head!,
    body: named.body!,
    armL: named.armL!,
    armR: named.armR!,
    stars: collectListed(clone, 'star'),
    glow: (named.glow as THREE.Mesh) ?? null,
  }
  clone.userData.parts = parts
  return clone
}

/* --------------------------- Setan lucu (musuh) --------------------------- */

const enemyTemplateCache = new Map<EnemyId, THREE.Group>()

function buildEnemy(enemyId: EnemyId): THREE.Group {
  const def = ENEMY_DEFS[enemyId]
  const g = new THREE.Group()
  const blackMat = basic(0x35281e)
  const whiteMat = std(0xfffdf8, { roughness: 0.55 })

  // bayangan blob lembut
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 16),
    new THREE.MeshBasicMaterial({ color: 0x2c5a2a, transparent: true, opacity: 0.28 }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  g.add(shadow)

  if (enemyId === 'pocong') {
    const kain = std(0xfdfcf5, { roughness: 0.9, flatShading: true })
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.85, 8, 14), kain)
    body.name = 'body'
    body.position.y = 1.0
    body.castShadow = true
    g.add(body)
    // ikatan simpul di atas
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), kain)
    knot.position.y = 1.78
    g.add(knot)
    const knotTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 8), kain)
    knotTip.position.y = 1.98
    g.add(knotTip)
    // wajah mengantuk di badan
    addFace(body, 0.55, { y: 0.32, spread: 0.22, closed: true, smileScale: 0.9 })
    // dahi kusut lucu
    const wrinkle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 4, 10, Math.PI), blackMat)
    wrinkle.position.set(0, 0.62, 0.5)
    wrinkle.rotation.z = Math.PI
    body.add(wrinkle)
  } else if (enemyId === 'kunti') {
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.15, 14), std(0xf6f2ff, { roughness: 0.75 }))
    dress.name = 'body'
    dress.position.y = 0.58
    dress.castShadow = true
    g.add(dress)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), std(0xfffaf2, { roughness: 0.6 }))
    head.name = 'head'
    head.position.y = 1.35
    head.castShadow = true
    g.add(head)
    // rambut gelap belakang + pigtails dengan pita pink
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.47, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      std(0x3a3550, { roughness: 1 }),
    )
    hair.position.y = 1.38
    hair.rotation.x = Math.PI * 0.8
    g.add(hair)
    for (const s of [-1, 1]) {
      const pig = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), std(0x3a3550, { roughness: 1 }))
      pig.position.set(s * 0.5, 1.42, -0.08)
      g.add(pig)
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12), std(0xff8fbf))
      tie.position.set(s * 0.38, 1.5, -0.05)
      tie.rotation.y = Math.PI / 2
      g.add(tie)
    }
    addFace(head, 0.45, { y: 0.02, spread: 0.2, eyeScale: 1.3, smileScale: 1.35, cheeks: true })
  } else if (enemyId === 'genderuwo') {
    const fur = std(0x9a7050, { roughness: 1, flatShading: true })
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.78, 14, 12), fur)
    body.name = 'body'
    body.position.y = 0.85
    body.castShadow = true
    g.add(body)
    // tonjolan bulu lucu
    for (let i = 0; i < 7; i++) {
      const bump = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), fur)
      const ang = (i / 7) * Math.PI * 2
      bump.position.set(Math.cos(ang) * 0.72, 1.15 + Math.sin(i * 2.1) * 0.18, Math.sin(ang) * 0.72)
      g.add(bump)
    }
    // telinga
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), fur)
      ear.position.set(s * 0.68, 1.45, 0)
      g.add(ear)
    }
    // lengan pendek mengayun
    const armGeo = new THREE.CapsuleGeometry(0.16, 0.4, 4, 8)
    const armL = new THREE.Mesh(armGeo, fur)
    armL.name = 'armL'
    armL.position.set(-0.85, 0.9, 0)
    armL.rotation.z = 0.9
    const armR = new THREE.Mesh(armGeo, fur)
    armR.name = 'armR'
    armR.position.set(0.85, 0.9, 0)
    armR.rotation.z = -0.9
    g.add(armL, armR)
    addFace(body, 0.78, { y: 0.35, spread: 0.3, eyeScale: 0.9, smileScale: 1.15, cheeks: false })
  } else if (enemyId === 'tuyul') {
    const skin = std(0xcfe0c8, { roughness: 0.45 })
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.35, 6, 10), skin)
    body.name = 'body'
    body.position.y = 0.5
    body.castShadow = true
    g.add(body)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), std(0xdcebd6, { roughness: 0.3 }))
    head.name = 'head'
    head.position.y = 1.05
    head.castShadow = true
    g.add(head)
    // kepala plontos mengkilap
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), std(0xffffff, { roughness: 0.1 }))
    shine.position.set(-0.12, 1.28, 0.3)
    shine.scale.set(1, 0.5, 0.3)
    g.add(shine)
    // cawat merah
    const loincloth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.34), std(0xd94f4f))
    loincloth.position.y = 0.32
    g.add(loincloth)
    // koin emas di tangan ( hasil mencuri )
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.04, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd76a, metalness: 0.9, roughness: 0.2 }),
    )
    coin.name = 'coin'
    coin.position.set(0.4, 0.75, 0.18)
    coin.rotation.x = Math.PI / 2.2
    g.add(coin)
    addFace(head, 0.42, { y: 0.0, spread: 0.19, eyeScale: 1.25, smileScale: 1.3 })
  } else if (enemyId === 'wewe') {
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.66, 1.3, 14), std(0xb9c4d6, { roughness: 0.85 }))
    dress.name = 'body'
    dress.position.y = 0.64
    dress.castShadow = true
    g.add(dress)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), std(0xe8d9c8, { roughness: 0.7 }))
    head.name = 'head'
    head.position.y = 1.5
    head.castShadow = true
    g.add(head)
    // rambut ibu-ibu dengan sanggul
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      std(0x6a6a7a, { roughness: 1 }),
    )
    hair.position.y = 1.53
    hair.rotation.x = Math.PI * 0.82
    g.add(hair)
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), std(0x6a6a7a, { roughness: 1 }))
    bun.position.set(0, 1.92, -0.15)
    g.add(bun)
    // selendang
    const shawl = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 16), std(0xc9a86a, { roughness: 1 }))
    shawl.position.y = 1.15
    shawl.rotation.x = Math.PI / 2
    g.add(shawl)
    addFace(head, 0.46, { y: 0.0, spread: 0.2, eyeScale: 1.05, smileScale: 0.85 })
  } else {
    // banaspati (boss) — bola api gembul lucu
    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xff8c42,
      emissive: 0xff5e1a,
      emissiveIntensity: 0.55,
      roughness: 0.5,
      flatShading: true,
    })
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), fireMat)
    body.name = 'body'
    body.position.y = 1.5
    body.castShadow = true
    g.add(body)
    // mahkota api kecil (animated)
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xffb520, emissiveIntensity: 1.1, roughness: 0.4 }),
      )
      flame.name = 'flame'
      const rr = 0.72
      flame.position.set(Math.cos(ang) * rr, 2.35, Math.sin(ang) * rr)
      flame.rotation.z = -Math.cos(ang) * 0.5
      flame.rotation.x = Math.sin(ang) * 0.5
      g.add(flame)
    }
    // lengan gembul tersungkup
    const armGeo = new THREE.CapsuleGeometry(0.22, 0.5, 6, 10)
    const armL = new THREE.Mesh(armGeo, fireMat)
    armL.name = 'armL'
    armL.position.set(-1.25, 1.4, 0.1)
    armL.rotation.z = 1.0
    const armR = new THREE.Mesh(armGeo, fireMat)
    armR.name = 'armR'
    armR.position.set(1.25, 1.4, 0.1)
    armR.rotation.z = -1.0
    g.add(armL, armR)
    addFace(body, 1.15, { y: 0.4, spread: 0.42, eyeScale: 1.1, angry: true, smileScale: 1.1 })
  }

  g.scale.setScalar(def.scale)
  return g
}

export function getEnemyModel(enemyId: EnemyId): THREE.Group {
  let tpl = enemyTemplateCache.get(enemyId)
  if (!tpl) {
    tpl = buildEnemy(enemyId)
    enemyTemplateCache.set(enemyId, tpl)
  }
  const clone = tpl.clone(true)
  const named = collectNamed(clone)
  clone.userData.parts = {
    body: named.body ?? null,
    head: named.head ?? null,
    armL: named.armL ?? null,
    armR: named.armR ?? null,
    coin: named.coin ?? null,
    flames: collectListed(clone, 'flame'),
  }
  return clone
}

/* ------------------------------ Proyektil ------------------------------ */

export function createOrb(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffd76a, emissiveIntensity: 1.8, roughness: 0.3 }),
  )
}

export function createBubble(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 14, 12),
    new THREE.MeshStandardMaterial({
      color: 0xd0ecff,
      emissive: 0x9fd0ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
    }),
  )
}

export function createCoin(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.07, 14),
    new THREE.MeshStandardMaterial({ color: 0xffd76a, metalness: 0.95, roughness: 0.2, emissive: 0xa67c1a, emissiveIntensity: 0.5 }),
  )
}

/* ------------------------------ Cincin jangkauan ------------------------------ */

export function createRangeRing(radius: number, color = 0x9ff2c8): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.16, radius, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.06
  return ring
}
