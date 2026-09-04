/* ============================================================
 * PENJAGA MASJID — World Expansion (P1)
 * Memperluas dunia jauh melebihi area jalur: perbukitan,
 * pegunungan parallax, sungai, kolam, hutan, batu & semak —
 * semua digabung (merge) agar tetap hemat draw call.
 * Dunia baru: radius ±110 x ±78 (4.5× lebih luas dari sebelumnya).
 * ============================================================ */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* ---------- util warna vertex ---------- */

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

/** Normalisasi geometri menjadi NON-INDEXED dengan atribut seragam
 *  (position, normal, uv, color) supaya mergeGeometries selalu berhasil. */
function normGeo(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g.index ? g.toNonIndexed() : g
  // pastikan normal ada
  if (!out.attributes.normal) out.computeVertexNormals()
  const n = out.attributes.position.count
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
  }
  return out
}

/* Deterministik supaya dunia konsisten antar reload */
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

/* Batas area gameplay inti (jalur + halaman) — dekorasi tidak boleh masuk sini. */
const CORE_X = 40
const CORE_Z = 25

/** true bila titik berada di area inti gameplay (yang harus bebas dekorasi besar) */
function inCore(x: number, z: number, pad = 3): boolean {
  return Math.abs(x) < CORE_X + pad && Math.abs(z) < CORE_Z + pad
}

/* ============================================================
 * 1) RUMPUT LUAS — plane besar dgn tekstur canvas 2048²
 * ============================================================ */

export const WORLD = { x: 230, z: 150 } // ukuran plane rumput utama

export function createMegaGroundTexture(): THREE.CanvasTexture {
  const W = 2048
  const H = 1332 // rasio sesuai plane 230×150
  const cvs = document.createElement('canvas')
  cvs.width = W
  cvs.height = H
  const ctx = cvs.getContext('2d')!
  const toX = (x: number) => ((x + WORLD.x / 2) / WORLD.x) * W
  const toY = (z: number) => ((z + WORLD.z / 2) / WORLD.z) * H
  const pxPerUnit = W / WORLD.x

  // gradasi rumput: terang di tengah (arena), makin keluar makin kaya/gelap
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.75)
  grad.addColorStop(0, '#8fd465')
  grad.addColorStop(0.55, '#7ec95b')
  grad.addColorStop(1, '#63b04c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // bercak rumput lembut besar (variasi warna)
  const rand = mulberry(20260904)
  for (let i = 0; i < 340; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(154, 224, 106, 0.30)' : i % 3 === 1 ? 'rgba(113, 197, 84, 0.28)' : 'rgba(88, 170, 66, 0.22)'
    const rx = rand() * W
    const ry = rand() * H
    const rw = 70 + rand() * 260
    const rh = 40 + rand() * 130
    ctx.beginPath()
    ctx.ellipse(rx, ry, rw, rh, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // jalur setan & halaman masjid digambar ulang di posisi yang sama seperti arena lama
  // (arena inti tetap 76×48 di tengah plane besar)
  const LANES: [number, number][][] = [
    [
      [-36, -8], [-26, -8], [-26, 4], [-16, 4], [-16, -2], [-10, -2],
    ],
    [
      [0, -22], [0, -14], [9, -14], [9, -9], [2, -9],
    ],
    [
      [36, 8], [26, 8], [26, -2], [16, -2], [16, 5], [9, 5],
    ],
  ]

  // Halaman masjid (batu hangat)
  ctx.fillStyle = '#f4e9cd'
  ctx.beginPath()
  ctx.ellipse(toX(0), toY(0), 15.5 * pxPerUnit, 13.5 * (H / WORLD.z) * 0.76, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ddc99a'
  ctx.lineWidth = 14
  ctx.stroke()

  // Pola batu halaman
  ctx.strokeStyle = 'rgba(210, 190, 140, 0.5)'
  ctx.lineWidth = 3
  for (let r = 4; r < 14; r += 3.2) {
    ctx.beginPath()
    ctx.ellipse(toX(0), toY(0), r * pxPerUnit, r * (H / WORLD.z) * 0.76, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Jalur setan (tan lembut)
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
  drawLane(3.1 * pxPerUnit, '#d9bd8f')
  drawLane(2.5 * pxPerUnit, '#ecd9a9')

  // jalanan desa kecil di luar arena (dekorasi komposisi)
  ctx.strokeStyle = 'rgba(233, 210, 160, 0.65)'
  ctx.lineWidth = 2.2 * pxPerUnit
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(toX(-WORLD.x / 2), toY(-40))
  ctx.bezierCurveTo(toX(-70), toY(-38), toX(-40), toY(-30), toX(-38), toY(-24.5))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toX(WORLD.x / 2), toY(36))
  ctx.bezierCurveTo(toX(80), toY(34), toX(52), toY(28), toX(38.5), toY(24.5))
  ctx.stroke()

  // rumput-texture noise halus (dots)
  for (let i = 0; i < 900; i++) {
    const rx = rand() * W
    const ry = rand() * H
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(30,80,20,0.05)'
    ctx.fillRect(rx, ry, 3, 3)
  }

  // bunga kecil di rumput luar (lebih padat di luar arena)
  const flowerColors = ['#ff9ecb', '#ffd166', '#fff5f0', '#c39bff', '#ff8f6b']
  for (let i = 0; i < 260; i++) {
    const rx = rand() * W
    const ry = rand() * H
    // skip area inti
    const wx = (rx / W) * WORLD.x - WORLD.x / 2
    const wz = (ry / H) * WORLD.z - WORLD.z / 2
    if (Math.abs(wx) < 42 && Math.abs(wz) < 27) continue
    ctx.fillStyle = flowerColors[i % flowerColors.length]
    ctx.beginPath()
    ctx.arc(rx, ry, 3 + rand() * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(cvs)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function createMegaGround(): THREE.Mesh {
  const tex = createMegaGroundTexture()
  const geo = new THREE.PlaneGeometry(WORLD.x, WORLD.z, 1, 1)
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.02 // sedikit di bawah arena lama
  mesh.receiveShadow = true
  mesh.name = 'megaGround'
  return mesh
}

/* ============================================================
 * 2) BUKIT RINGAN (elevasi) — kubah rendah di sekitar arena
 *    Tidak mengganggu gameplay (jauh dari jalur).
 * ============================================================ */

function addHill(geos: THREE.BufferGeometry[], x: number, z: number, r: number, h: number, hex: number) {
  const g = new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.35)
  g.scale(1, h / r, 1)
  g.translate(x, -0.35, z) // sedikit tenggelam
  geos.push(normGeo(colorGeo(g, hex)))
}

/* ============================================================
 * 3) POHON (merge vertex-color, 2 varian: bulat & pinus)
 * ============================================================ */

function addTree(geos: THREE.BufferGeometry[], x: number, z: number, s: number, rand: () => number, kind: 'round' | 'pine') {
  const trunkH = 1.3 * s
  const trunk = new THREE.CylinderGeometry(0.16 * s, 0.24 * s, trunkH, 6)
  trunk.translate(x, trunkH / 2, z)
  geos.push(normGeo(colorGeo(trunk, 0x8a5a2b)))

  const greens = [0x63b94e, 0x74c95a, 0x54a648, 0x6fc25e, 0x4d9e46]
  if (kind === 'round') {
    const r = 0.95 * s
    const main = new THREE.SphereGeometry(r, 8, 7)
    main.translate(x, trunkH + r * 0.75, z)
    geos.push(normGeo(colorGeo(main, greens[Math.floor(rand() * greens.length)])))
    const b1 = new THREE.SphereGeometry(r * 0.62, 7, 6)
    b1.translate(x + 0.55 * s, trunkH + r * 1.15, z + 0.15 * s)
    geos.push(normGeo(colorGeo(b1, greens[Math.floor(rand() * greens.length)])))
    const b2 = new THREE.SphereGeometry(r * 0.5, 7, 6)
    b2.translate(x - 0.5 * s, trunkH + r * 1.0, z - 0.28 * s)
    geos.push(normGeo(colorGeo(b2, greens[Math.floor(rand() * greens.length)])))
  } else {
    // pinus bertingkat 3
    for (let i = 0; i < 3; i++) {
      const rr = (0.85 - i * 0.22) * s
      const hh = (1.1 - i * 0.12) * s
      const cone = new THREE.ConeGeometry(rr, hh, 7)
      cone.translate(x, trunkH + 0.45 * s + i * 0.72 * s + hh / 2, z)
      geos.push(normGeo(colorGeo(cone, 0x3f9b45 + (i * 0x02140a))))
    }
  }
}

/* ============================================================
 * 4) BATU, SEMAK, LILY & JEMBATAN KECIL
 * ============================================================ */

function addRock(geos: THREE.BufferGeometry[], x: number, z: number, s: number, rand: () => number) {
  const rock = new THREE.DodecahedronGeometry(0.45 * s, 0)
  rock.scale(1, 0.62, 0.85)
  rock.rotateY(rand() * Math.PI * 2)
  rock.translate(x, 0.18 * s, z)
  const grays = [0xb8b2a6, 0xc4beb2, 0xa8a298, 0xd0cac0]
  geos.push(normGeo(colorGeo(rock, grays[Math.floor(rand() * grays.length)])))
}

function addBush(geos: THREE.BufferGeometry[], x: number, z: number, s: number, rand: () => number) {
  const greens = [0x5cba50, 0x6cc95a, 0x4da848]
  for (let i = 0; i < 3; i++) {
    const r = (0.34 - i * 0.06) * s
    const b = new THREE.SphereGeometry(r, 7, 6)
    b.translate(x + (rand() - 0.5) * 0.5 * s, r * 0.8, z + (rand() - 0.5) * 0.5 * s)
    geos.push(normGeo(colorGeo(b, greens[Math.floor(rand() * greens.length)])))
  }
}

/* ============================================================
 * 5) SUNGAI + KOLAM (air animasi sederhana via material emissive)
 * ============================================================ */

export interface WaterParts {
  mesh: THREE.Mesh
  material: THREE.MeshStandardMaterial
}

export function createRiver(): WaterParts {
  // sungai lebar melengkung di sisi timur laut + kolam bunga teratai
  const shape = new THREE.Shape()
  const w = 4.4
  shape.moveTo(0, -w)
  shape.bezierCurveTo(30, -w, 60, -w * 1.4, 95, -w * 0.6)
  shape.lineTo(95, w * 0.6)
  shape.bezierCurveTo(60, w * 1.4, 30, w, 0, w)
  shape.closePath()

  const geo = new THREE.ShapeGeometry(shape, 24)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6fd0e8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.15,
    metalness: 0.1,
    emissive: 0x2a8ca8,
    emissiveIntensity: 0.25,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(46, 0.045, -44)
  mesh.name = 'river'
  // tepian sungai (pasir)
  const bank = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshStandardMaterial({ color: 0xe8d9a9, roughness: 1 }),
  )
  bank.rotation.x = -Math.PI / 2
  bank.position.set(46, 0.03, -44)
  bank.scale.set(1.16, 1.12, 1)
  bank.name = 'riverBank'
  mesh.userData.bank = bank
  return { mesh, material: mat }
}

export function createPond(): WaterParts {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7fd4e8,
    transparent: true,
    opacity: 0.88,
    roughness: 0.12,
    emissive: 0x2a8ca8,
    emissiveIntensity: 0.22,
  })
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(7.5, 26), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(-62, 0.045, 42)
  mesh.name = 'pond'
  return { mesh, material: mat }
}

/* ============================================================
 * 6) PEGUNUNGAN PARALLAX JAUH (latar, warna desaturasi)
 * ============================================================ */

export function createMountainRange(): THREE.Group {
  const g = new THREE.Group()
  const rand = mulberry(777)
  // dua lapis: jauh (biru pucat) & dekat (hijau kabur)
  const layers: { dist: number; y: number; hex: number; h: number; w: number; op: number }[] = [
    { dist: 195, y: 0, hex: 0xa8c8d8, h: 52, w: 68, op: 0.92 },
    { dist: 152, y: 0, hex: 0x9fc4ae, h: 38, w: 56, op: 0.96 },
  ]
  for (const L of layers) {
    const geos: THREE.BufferGeometry[] = []
    const count = Math.max(9, Math.round((WORLD.x * 2.4) / L.w))
    for (let i = 0; i < count; i++) {
      const x = -WORLD.x * 1.2 + (i / count) * WORLD.x * 2.4 + (rand() - 0.5) * L.w * 0.5
      const hh = L.h * (0.55 + rand() * 0.75)
      const cone = new THREE.ConeGeometry(L.w * (0.42 + rand() * 0.25), hh, 5, 1)
      // puncak bersalju kecil
      cone.translate(x, hh / 2 - 2, -L.dist)
      geos.push(normGeo(colorGeo(cone, L.hex)))
    }
    const merged = mergeGeometries(geos, false)!
    geos.forEach((x) => x.dispose())
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      transparent: true,
      opacity: L.op,
      fog: true,
    })
    const mesh = new THREE.Mesh(merged, mat)
    mesh.position.y = -4
    g.add(mesh)
  }
  g.name = 'mountains'
  return g
}

/* ============================================================
 * 7) KABUT LEMBUT untuk menyatu sisi parallax (opsional visual)
 * ============================================================ */

/* ============================================================
 * 8) KOMPOSISI UTAMA — buildWorldExpansion()
 * ============================================================ */

export interface WorldExpansion {
  group: THREE.Group
  river: WaterParts | null
  pond: WaterParts | null
  mountains: THREE.Group
  /** dipanggil tiap frame — animasi air */
  update: (t: number) => void
}

export function buildWorldExpansion(): WorldExpansion {
  const group = new THREE.Group()
  const rand = mulberry(20260905)
  const geos: THREE.BufferGeometry[] = []
  const geosNoShadow: THREE.BufferGeometry[] = []

  /* --- Perbukitan lembut mengelilingi arena (elevasi) --- */
  const hillSpots: [number, number, number, number][] = [
    // x, z, radius, tinggi — di luar core & TIDAK menabrak sungai/kolam
    [-58, -18, 26, 7], [66, -6, 26, 7], [-52, 22, 22, 5.5], [50, 20, 26, 6.5],
    [-70, 0, 20, 5], [70, 8, 22, 5.5], [0, -52, 34, 8.5], [0, 52, 34, 8],
    [-32, -46, 20, 6], [24, -46, 20, 6.5], [-34, 46, 22, 6], [32, 46, 24, 6.5],
    [100, -22, 30, 9], [-85, -28, 28, 8], [96, 34, 30, 9], [-92, 30, 26, 8],
    [0, -84, 44, 11], [0, 82, 44, 10], [-70, -62, 30, 9], [104, -58, 30, 9],
    [-70, 62, 30, 8.5], [70, 60, 30, 8.5],
  ]
  hillSpots.forEach(([x, z, r, h]) => {
    // skip jika menabrak sungai/kolam/jembatan (safety double-check)
    if (x + r > 30 && x - r < 102 && z + r > -58 && z - r < -28) return // koridor sungai
    if (x + r > -82 && x - r < -42 && z + r > 22 && z - r < 62) return // area kolam
    addHill(geos, x, z, r, h, rand() > 0.5 ? 0x76c258 : 0x6cbb52)
  })

  /* --- Sabuk hutan mengelilingi arena --- */
  let placed = 0
  const maxTrees = 210
  let guard = 0
  while (placed < maxTrees && guard < 3000) {
    guard++
    const x = (rand() - 0.5) * (WORLD.x * 0.94)
    const z = (rand() - 0.5) * (WORLD.z * 0.94)
    // jarak dari core minimal 44 (di luar arena + buffer kamera)
    const dx = Math.max(0, Math.abs(x) - CORE_X)
    const dz = Math.max(0, Math.abs(z) - CORE_Z)
    const ringDist = Math.sqrt(dx * dx + dz * dz)
    if (ringDist < 6) continue
    // hindari sungai timur-laut & kolam barat-daya (cepat kasar)
    if (x > 38 && x < 100 && z > -56 && z < -32) continue
    if (x < -76 && x > -48 && z > 28 && z < 56) continue
    const s = 1.0 + rand() * 1.35
    addTree(geos, x, z, s, rand, rand() > 0.72 ? 'pine' : 'round')
    placed++
  }

  /* --- Cluster taman kecil (pohon rapi + bunga) di luar arena --- */
  const parks: [number, number][] = [
    [-52, -6], [54, 8], [-14, -40], [18, 40], [46, -18], [-46, 14],
  ]
  parks.forEach(([px, pz]) => {
    for (let i = 0; i < 7; i++) {
      const a = rand() * Math.PI * 2
      const rr = 3 + rand() * 7
      addTree(geos, px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 0.8 + rand() * 0.5, rand, 'round')
    }
    // semak bunga di taman
    for (let i = 0; i < 5; i++) {
      const a = rand() * Math.PI * 2
      addBush(geosNoShadow, px + Math.cos(a) * (2 + rand() * 5), pz + Math.sin(a) * (2 + rand() * 5), 0.9 + rand() * 0.6, rand)
    }
  })

  /* --- Batu & semak tersebar --- */
  for (let i = 0; i < 130; i++) {
    const x = (rand() - 0.5) * (WORLD.x * 0.9)
    const z = (rand() - 0.5) * (WORLD.z * 0.9)
    const dx = Math.max(0, Math.abs(x) - CORE_X)
    const dz = Math.max(0, Math.abs(z) - CORE_Z)
    if (Math.sqrt(dx * dx + dz * dz) < 4) continue
    if (x > 38 && x < 100 && z > -56 && z < -32) continue
    if (i % 2 === 0) addRock(geos, x, z, 0.7 + rand() * 1.5, rand)
    else addBush(geosNoShadow, x, z, 0.7 + rand() * 1.1, rand)
  }

  /* --- Rumah desa kecil di kejauhan (box + atap) --- */
  const villages: [number, number][] = [
    [-72, -34], [-64, -40], [-80, -26], [76, -38], [84, -30], [70, -44],
    [-78, 38], [-70, 44], [72, 42], [80, 36],
  ]
  villages.forEach(([x, z]) => {
    const w = 3.4 + rand() * 1.6
    const d = 2.8 + rand() * 1.2
    const h = 2.2 + rand() * 0.6
    const walls = new THREE.BoxGeometry(w, h, d)
    walls.translate(x, h / 2, z)
    geos.push(normGeo(colorGeo(walls, rand() > 0.5 ? 0xfff6e0 : 0xf4e9cd)))
    const roof = new THREE.ConeGeometry(Math.max(w, d) * 0.85, 2.0, 4)
    roof.rotateY(Math.PI / 4)
    roof.translate(x, h + 1.0, z)
    geos.push(normGeo(colorGeo(roof, rand() > 0.5 ? 0xd94f4f : 0xe8734f)))
  })

  const merged = mergeGeometries(geos, false)!
  geos.forEach((x) => x.dispose())
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  const terrain = new THREE.Mesh(merged, terrainMat)
  terrain.castShadow = true
  terrain.receiveShadow = false
  terrain.name = 'worldTerrain'
  group.add(terrain)

  const merged2 = mergeGeometries(geosNoShadow, false)!
  geosNoShadow.forEach((x) => x.dispose())
  const terrain2 = new THREE.Mesh(merged2, terrainMat)
  terrain2.castShadow = false
  terrain2.receiveShadow = false
  terrain2.name = 'worldDecor'
  group.add(terrain2)

  /* --- Air --- */
  const river = createRiver()
  group.add(river.mesh.userData.bank as THREE.Mesh)
  group.add(river.mesh)
  const pond = createPond()
  // tepi kolam pasir
  const pondBank = new THREE.Mesh(
    new THREE.CircleGeometry(8.8, 26),
    new THREE.MeshStandardMaterial({ color: 0xe8d9a9, roughness: 1 }),
  )
  pondBank.rotation.x = -Math.PI / 2
  pondBank.position.set(-62, 0.03, 42)
  group.add(pondBank, pond.mesh)

  /* --- Bunga teratai di kolam (dekor kecil) --- */
  const lilyGeos: THREE.BufferGeometry[] = []
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2
    const rr = rand() * 5.6
    const pad = new THREE.CircleGeometry(0.5 + rand() * 0.3, 8)
    pad.translate(-62 + Math.cos(a) * rr, 0.07, 42 + Math.sin(a) * rr)
    lilyGeos.push(normGeo(colorGeo(pad, 0x6fc25e)))
    if (rand() > 0.55) {
      const fl = new THREE.SphereGeometry(0.18, 7, 6)
      fl.translate(-62 + Math.cos(a) * rr, 0.16, 42 + Math.sin(a) * rr)
      lilyGeos.push(normGeo(colorGeo(fl, 0xffb3d1)))
    }
  }
  const lilies = new THREE.Mesh(
    mergeGeometries(lilyGeos, false)!,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
  )
  lilyGeos.forEach((x) => x.dispose())
  group.add(lilies)

  /* --- Jembatan kayu kecil melintasi sungai --- */
  const bridge = new THREE.Group()
  bridge.name = 'bridge'
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a6a3f, roughness: 0.9 })
  for (let i = 0; i < 7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.95), woodMat)
    plank.position.set(0, 0.62, -2.4 + i * 0.8)
    plank.rotation.x = 0.06
    bridge.add(plank)
  }
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 0.14), woodMat)
    rail.position.set(s * 2.5, 1.25, -1.8)
    bridge.add(rail)
    const rail2 = rail.clone()
    rail2.position.z = 1.8
    bridge.add(rail2)
    for (const zz of [-1.8, 0, 1.8]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.16), woodMat)
      post.position.set(s * 2.5, 0.95, zz)
      bridge.add(post)
    }
  }
  bridge.position.set(48, 0, -44)
  bridge.rotation.y = -0.35
  group.add(bridge)

  /* --- Pegunungan parallax --- */
  const mountains = createMountainRange()
  group.add(mountains)

  /* --- animasi air --- */
  const update = (t: number) => {
    river.material.emissiveIntensity = 0.22 + Math.sin(t * 1.7) * 0.08
    pond.material.emissiveIntensity = 0.2 + Math.cos(t * 1.3) * 0.07
    river.mesh.position.y = 0.045 + Math.sin(t * 2.1) * 0.012
  }

  return { group, river, pond, mountains, update }
}

/* ============================================================
 * 9) DESA/NETRAL background ekstra: kawanan awan jauh statis
 *    di ketinggian (penguat kesan luas dunia)
 * ============================================================ */

export function createHighClouds(): THREE.Group {
  const rand = mulberry(31337)
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.9,
    fog: false,
  })
  const geo = new THREE.SphereGeometry(1, 8, 7)
  for (let i = 0; i < 16; i++) {
    const c = new THREE.Group()
    const s = 4 + rand() * 7
    for (let j = 0; j < 4; j++) {
      const m = new THREE.Mesh(geo, mat)
      m.position.set((j - 1.5) * s * 0.55 + (rand() - 0.5) * 2, (rand() - 0.5) * s * 0.25, (rand() - 0.5) * s * 0.4)
      m.scale.setScalar(s * (0.55 + rand() * 0.4))
      m.scale.y *= 0.55
      c.add(m)
    }
    c.position.set((rand() - 0.5) * 380, 38 + rand() * 22, -(130 + rand() * 90))
    g.add(c)
  }
  g.name = 'highClouds'
  return g
}
