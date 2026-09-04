/* ============================================================
 * PENJAGA MASJID — GameEngine
 * Scene, lighting, bloom, ambient hidup, wave manager,
 * placement drag & drop, screenshot mode foto, kemenangan.
 * ============================================================ */

import * as THREE from 'three'
import gsap from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import {
  CHAR_DEFS,
  ENEMY_DEFS,
  WAVES,
  TIPS,
  LANES,
  SLOTS,
  GAME_CONST,
  DUA_CONST,
  RUN_MODS,
  resetRunMods,
  applyDailyMods,
  pickDailyModifier,
  dailyKey,
  type CharId,
  type EnemyId,
  type WaveDef,
  type Quality,
  type DailyModifier,
} from './data'
import { createGround, createMosque, createSlotPad, createTree, createFlowerField, createCloud, createBird, createButterfly, createRangeRing, getCharacterModel } from './models'
import { buildWorldExpansion, createMegaGround, createHighClouds, type WorldExpansion } from './world'
import { ParticleSystem } from './particles'
import { EntityManager, type Enemy, type Tower } from './entities'
import { CameraController } from './camera'
import { audio } from './audio'
import { gameStore, type CameraMode } from './store'
import { computeStars } from './persist'
import { getLevel, levelWaves } from './levels'
import {
  checkBadges,
  recordSessionEnd,
  isTutorialSeen,
  markTutorialDone,
  bumpLossStreak,
  clearLossStreak,
  recordDailyWin,
  recordLevelResult,
  grantRunReward,
} from './achievements'

interface SlotObj {
  group: THREE.Group
  pad: THREE.Mesh
  ring: THREE.Mesh
  x: number
  z: number
  occupied: boolean
}

interface SpawnEvent {
  time: number
  enemyId: EnemyId
  lane: number
}

interface Wanderer {
  group: THREE.Group
  target: THREE.Vector3
  speed: number
  phase: number
}

interface AmbientCritter {
  group: THREE.Group
  type: 'bird' | 'butterfly' | 'cloud'
  t: number
  speed: number
  radius: number
  height: number
  phase: number
}

export class GameEngine {
  private canvas!: HTMLCanvasElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private composer: EffectComposer | null = null
  private bloomPass: UnrealBloomPass | null = null
  cameraCtrl!: CameraController
  private particles!: ParticleSystem
  private manager!: EntityManager

  private mosque!: { group: THREE.Group; parts: { domeLight: THREE.PointLight; lanterns: THREE.Mesh[] } }
  private slots: SlotObj[] = []
  private wanderers: Wanderer[] = []
  private critters: AmbientCritter[] = []
  private trees: THREE.Group[] = []
  /** P1: dunia luas (bukit, hutan, sungai, gunung parallax) */
  private worldExp: WorldExpansion | null = null

  private raycaster = new THREE.Raycaster()
  private pointerNdc = new THREE.Vector2()
  private hoverSlot = -1
  private ghostRange: THREE.Mesh | null = null
  private ghostChar: CharId | null = null

  private elapsed = 0
  private rafId = 0
  private disposed = false
  private quality: Quality = 'high'
  private usePost = true

  // wave state
  private spawnEvents: SpawnEvent[] = []
  private waveElapsed = 0
  private spawnCursor = 0
  private laneCursor = 0
  private victoryTimer = 0
  private victoryFxTimer = 0
  private auraTimer = 0
  private mosqueToastCd = 0
  private frameCount = 0
  /** overlay DOM cahaya keemasan saat Doa Bersama aktif */
  private duaOverlay: HTMLElement | null = null
  /** total pahala hasil kotak sedekah Misbah pertandingan ini */
  private misbahGenTotal = 0
  /** cooldown suara koin sedekah agar tidak berisik */
  private sedekahSoundCd = 0
  /** timer langkah tutorial aktif */
  private tutTimer = 0
  /** kunci tanggal tantangan harian yang sedang berjalan */
  private dailyKeyRun: string | null = null

  /* P3: wave aktif per level (level select) */
  private levelWaves: WaveDef[] = WAVES
  /** P4: bintang toko yang didapat dari run terakhir (untuk layar menang) */
  runStarGain = 0

  private lastFrameTime = performance.now()

  /* =============================== INIT =============================== */

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    // debug probe (dev)
    ;(window as unknown as Record<string, unknown>).__pmEngine = this
    ;(window as unknown as Record<string, unknown>).__THREE = THREE
    ;(window as unknown as Record<string, unknown>).__pmStore = gameStore
    ;(window as unknown as Record<string, unknown>).__pmMods = RUN_MODS

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x8fd4ff)
    this.scene.fog = new THREE.Fog(0xbfe8ff, 110, 230)

    // environment reflections untuk kubah emas berkilau
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.3

    this.cameraCtrl = new CameraController(canvas.clientWidth / Math.max(1, canvas.clientHeight))

    this.setupLights()
    this.setupWorld()
    this.setupPost()

    this.particles = new ParticleSystem()
    this.scene.add(this.particles.group)

    this.manager = new EntityManager(this.particles, {
      onEnemyKilled: (reward, pos, enemyId) => this.onEnemyKilled(reward, pos, enemyId),
      onEnemyLeaked: (enemy) => this.onEnemyLeaked(enemy),
      onBossShockwave: (duration) => this.onBossShockwave(duration),
      onPahalaTick: (amount, pos, level) => this.onPahalaTick(amount, pos, level),
    })
    this.scene.add(this.manager.group)

    this.applyQuality('high')

    this.bindEvents()
    this.loop()
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight(0xbfe6ff, 0x7bc96f, 0.45)
    this.scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xfff2d8, 1.5)
    sun.position.set(24, 38, 18)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -46
    sun.shadow.camera.right = 46
    sun.shadow.camera.top = 34
    sun.shadow.camera.bottom = -34
    sun.shadow.camera.far = 110
    sun.shadow.bias = -0.0004
    this.scene.add(sun)

    // cahaya lembut tambahan dari depan biar wajah chibi cerah
    const fill = new THREE.DirectionalLight(0xffffff, 0.25)
    fill.position.set(-14, 20, 26)
    this.scene.add(fill)
  }

  private setupWorld() {
    /* ---- P1: rumput mega-luas (230×150) — tidak ada void abu-abu lagi ---- */
    const mega = createMegaGround()
    this.scene.add(mega)

    // arena inti (tekstur lama dengan halaman masjid + jalur)
    const ground = createGround()
    this.scene.add(ground)

    // P1: ekspansi — perbukitan, hutan, taman, sungai, kolam, desa, jembatan, gunung parallax
    this.worldExp = buildWorldExpansion()
    this.scene.add(this.worldExp.group)

    // P1: awan tinggi jauh (kesan dunia luas)
    this.scene.add(createHighClouds())

    // masjid
    this.mosque = createMosque()
    this.scene.add(this.mosque.group)

    // slot penempatan
    SLOTS.forEach((s, i) => {
      const { group, pad, ring } = createSlotPad()
      group.position.set(s.x, 0, s.z)
      pad.userData.slotIndex = i
      this.scene.add(group)
      this.slots.push({ group, pad, ring, x: s.x, z: s.z, occupied: false })
    })

    // pohon di tepi peta (jauh dari jalur)
    const treeSpots: [number, number, number][] = [
      [-33, -18, 1.3], [-28, 14, 1.1], [-36, 2, 1.2], [33, -16, 1.25], [31, 16, 1.1],
      [36, 0, 1.2], [-20, -18, 1.0], [22, -19, 1.05], [-6, -20, 0.95], [10, 19, 1.0],
      [-24, 19, 0.9], [24, 15, 1.0], [-16, 12, 0.85], [18, -15, 0.9], [4, -20, 0.9],
      [-10, 17, 0.95], [34, -9, 1.0], [-34, -15, 1.1],
    ]
    treeSpots.forEach(([x, z, s]) => {
      const t = createTree(s)
      t.position.set(x, 0, z)
      t.rotation.y = Math.random() * Math.PI * 2
      this.scene.add(t)
      this.trees.push(t)
    })

    // ladang bunga (merged)
    this.scene.add(createFlowerField(52))

    // awan kartun
    for (let i = 0; i < 9; i++) {
      const c = createCloud()
      c.position.set((Math.random() - 0.5) * 90, 24 + Math.random() * 10, (Math.random() - 0.5) * 50)
      const scale = 1.4 + Math.random() * 1.2
      c.scale.setScalar(scale)
      this.scene.add(c)
      this.critters.push({ group: c, type: 'cloud', t: Math.random() * 100, speed: 0.4 + Math.random() * 0.5, radius: 0, height: 0, phase: 0 })
    }
    // burung
    for (let i = 0; i < 5; i++) {
      const b = createBird()
      this.scene.add(b)
      this.critters.push({
        group: b, type: 'bird', t: Math.random() * 100,
        speed: 0.15 + Math.random() * 0.2, radius: 24 + Math.random() * 14,
        height: 16 + Math.random() * 7, phase: Math.random() * Math.PI * 2,
      })
    }
    // kupu-kupu
    for (let i = 0; i < 7; i++) {
      const bf = createButterfly()
      this.scene.add(bf)
      this.critters.push({
        group: bf, type: 'butterfly', t: Math.random() * 100,
        speed: 0.5 + Math.random() * 0.7, radius: 6 + Math.random() * 16,
        height: 1 + Math.random() * 2.2, phase: Math.random() * Math.PI * 2,
      })
    }

    // anak-anak kecil jalan-jalan di halaman masjid (menu hidup)
    const kids: CharId[] = ['ali', 'aisyah', 'umar', 'fatimah', 'misbah']
    kids.forEach((k, i) => {
      const g = getCharacterModel(k, 1)
      g.position.set(-5 + i * 3.2, 0, 9.5 + (i % 2) * 2.5)
      this.scene.add(g)
      this.wanderers.push({ group: g, target: this.randomCourtyardPoint(), speed: 0.7 + Math.random() * 0.5, phase: Math.random() * 10 })
    })
  }

  private randomCourtyardPoint(): THREE.Vector3 {
    return new THREE.Vector3(-7 + Math.random() * 14, 0, 8.5 + Math.random() * 5)
  }

  private setupPost() {
    const size = new THREE.Vector2()
    this.renderer.getSize(size)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.cameraCtrl.camera))
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.45, // kekuatan — "berkah bersinar" lembut
      0.6,
      1.05, // threshold linear: hanya elemen HDR (lampu, kubah, orb) yang berkilau
    )
    this.composer.addPass(this.bloomPass)
    const vignette = new ShaderPass(VignetteShader)
    vignette.uniforms.offset.value = 1.15
    vignette.uniforms.darkness.value = 0.32
    this.composer.addPass(vignette)
    // OutputPass wajib: tone mapping + konversi sRGB di akhir rantai
    this.composer.addPass(new OutputPass())
  }

  /* =============================== QUALITY =============================== */

  applyQuality(q: Quality) {
    this.quality = q
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    if (q === 'low') {
      this.renderer.setPixelRatio(1)
      this.renderer.shadowMap.enabled = false
      this.usePost = false
    } else if (q === 'medium') {
      this.renderer.setPixelRatio(1)
      this.renderer.shadowMap.enabled = true
      this.usePost = true
    } else {
      this.renderer.setPixelRatio(Math.min(dpr, 2))
      this.renderer.shadowMap.enabled = true
      this.usePost = true
    }
    gameStore.set((s) => ({ ...s, quality: q }))
    this.resize()
  }

  /* =============================== EVENTS =============================== */

  private downPos = { x: 0, y: 0 }
  private isDown = false
  private moved = 0

  /* ---------- P2: pinch-to-zoom ---------- */
  private activePointers = new Map<number, { x: number; y: number }>()
  private pinchDist = 0
  private pinchMode = false

  private calcPinchDist(): number {
    const pts = Array.from(this.activePointers.values())
    if (pts.length < 2) return 0
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  private bindEvents() {
    const c = this.canvas
    c.addEventListener('pointerdown', this.onPointerDown)
    c.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    c.addEventListener('wheel', this.onWheel, { passive: false })
    c.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('resize', this.resize)
    window.addEventListener('pointercancel', this.onPointerUp)
  }

  private onContextMenu = (e: Event) => e.preventDefault()

  private onPointerDown = (e: PointerEvent) => {
    if (e.button === 2) {
      this.cancelPlacing()
      return
    }
    // P2: catat pointer untuk pinch tracking
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (this.activePointers.size >= 2) {
      // dua jari turun → mulai pinch, batalkan drag kamera
      this.pinchMode = true
      this.isDown = false
      this.pinchDist = this.calcPinchDist()
      this.cameraCtrl.stopMomentum()
      return
    }
    this.isDown = true
    this.pinchMode = false
    this.moved = 0
    this.downPos = { x: e.clientX, y: e.clientY }
    const st = gameStore.get()
    if (st.cameraMode !== 'iso') {
      this.cameraCtrl.onPointerDown(e.clientX, e.clientY, e.button)
      return
    }
    // mode iso & sedang memilih karakter → klik slot langsung tempatkan
    if (st.selectedCharId) {
      this.updatePointerNdc(e)
      const slotIdx = this.raycastSlot()
      if (slotIdx >= 0 && this.tryPlace(slotIdx, st.selectedCharId)) {
        this.isDown = false
        return
      }
    }
    this.cameraCtrl.onPointerDown(e.clientX, e.clientY, e.button)
  }

  private onPointerMove = (e: PointerEvent) => {
    // P2: perbarui posisi pointer aktif
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    // P2: pinch-to-zoom (dua jari aktif)
    if (this.pinchMode && this.activePointers.size >= 2) {
      const d = this.calcPinchDist()
      if (this.pinchDist > 0 && d > 0) {
        this.cameraCtrl.applyPinch(d / this.pinchDist)
      }
      this.pinchDist = d
      return
    }
    if (this.isDown) {
      this.moved += Math.abs(e.clientX - this.downPos.x) + Math.abs(e.clientY - this.downPos.y)
    }
    const st = gameStore.get()
    // hover slot saat drag / memilih
    if (st.selectedCharId && st.cameraMode === 'iso' && !this.pinchMode) {
      this.updatePointerNdc(e)
      this.updateHoverSlot(st.selectedCharId)
    }
    if (this.isDown) {
      this.cameraCtrl.onPointerMove(e.clientX, e.clientY)
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    const st = gameStore.get()
    // P2: lepas pointer dari pinch tracking
    this.activePointers.delete(e.pointerId)
    if (this.activePointers.size < 2) {
      if (this.pinchMode && this.activePointers.size === 0) this.pinchMode = false
      this.pinchDist = 0
    }
    const wasClick = this.isDown && this.moved < 8 && !this.pinchMode
    this.isDown = false
    this.cameraCtrl.onPointerUp()

    if (this.pinchMode) return
    if (st.cameraMode !== 'iso') return

    // drag-drop: lepas di atas slot
    if (st.selectedCharId) {
      this.updatePointerNdc(e)
      const slotIdx = this.raycastSlot()
      if (slotIdx >= 0 && this.tryPlace(slotIdx, st.selectedCharId)) return
      // lepas di area bukan slot → tetap terpilih (mode klik-klik)
      return
    }

    if (wasClick) {
      this.updatePointerNdc(e)
      const tower = this.raycastTower()
      if (tower) {
        this.selectTower(tower)
        return
      }
      // klik area kosong → batal pilih tower
      if (st.selectedTower) this.deselectTower()
    }
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.cameraCtrl.onWheel(e.deltaY)
  }

  private updatePointerNdc(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private raycastSlot(): number {
    this.raycaster.setFromCamera(this.pointerNdc, this.cameraCtrl.camera)
    const pads = this.slots.map((s) => s.pad)
    const hits = this.raycaster.intersectObjects(pads, false)
    return hits.length > 0 ? (hits[0].object.userData.slotIndex as number) : -1
  }

  private raycastTower(): Tower | null {
    this.raycaster.setFromCamera(this.pointerNdc, this.cameraCtrl.camera)
    const groups = this.manager.towers.map((t) => t.group)
    const hits = this.raycaster.intersectObjects(groups, true)
    if (hits.length === 0) return null
    let obj: THREE.Object3D | null = hits[0].object
    while (obj && !obj.userData.towerSlot) obj = obj.parent
    if (!obj) return null
    return this.manager.towers.find((t) => t.slotIndex === obj!.userData.towerSlot) ?? null
  }

  /* =============================== PLACEMENT =============================== */

  beginPlacing(charId: CharId) {
    this.ghostChar = charId
    const def = CHAR_DEFS[charId]
    if (!this.ghostRange) {
      this.ghostRange = createRangeRing(def.levels[0].range, 0xffe9a8)
      this.scene.add(this.ghostRange)
    } else {
      this.ghostRange.scale.setScalar(1)
      this.ghostRingMaterial().color.setHex(0xffe9a8)
    }
    this.ghostRange.geometry.dispose()
    this.ghostRange.geometry = new THREE.RingGeometry(def.levels[0].range - 0.16, def.levels[0].range, 48)
    this.ghostRange.visible = true
    this.refreshSlotHighlights()
  }

  private ghostRingMaterial(): THREE.MeshBasicMaterial {
    return this.ghostRange!.material as THREE.MeshBasicMaterial
  }

  endDrag() {
    // dipanggil UI saat pointer dilepas; jika slot valid sudah ditangani canvas handler
    if (gameStore.get().selectedCharId) this.refreshSlotHighlights()
  }

  cancelPlacing() {
    this.ghostChar = null
    if (this.ghostRange) this.ghostRange.visible = false
    gameStore.set((s) => ({ ...s, selectedCharId: null, dragging: false }))
    this.refreshSlotHighlights()
  }

  private updateHoverSlot(charId: CharId) {
    const idx = this.raycastSlot()
    if (idx === this.hoverSlot) return
    this.hoverSlot = idx
    const def = CHAR_DEFS[charId]
    const st = gameStore.get()
    this.slots.forEach((s, i) => {
      const mat = s.pad.material as THREE.MeshStandardMaterial
      const free = !s.occupied
      const affordable = st.pahala >= def.cost
      const ok = free && affordable
      mat.emissive.setHex(i === idx && ok ? 0xffd76a : ok ? 0x7bd45f : 0xd97a7a)
      mat.emissiveIntensity = i === idx ? 0.9 : 0.45
      s.ring.visible = true
      ;(s.ring.material as THREE.MeshStandardMaterial).color.setHex(
        i === idx && ok ? 0xffd76a : ok ? 0x9be07a : 0xe88a8a,
      )
    })
    if (idx >= 0 && this.ghostRange) {
      const s = this.slots[idx]
      this.ghostRange.position.set(s.x, 0.07, s.z)
    }
  }

  private refreshSlotHighlights() {
    const st = gameStore.get()
    const active = !!st.selectedCharId
    this.slots.forEach((s) => {
      const mat = s.pad.material as THREE.MeshStandardMaterial
      if (!active) {
        mat.emissive.setHex(0x9be07a)
        mat.emissiveIntensity = s.occupied ? 0.05 : 0.14
        s.ring.visible = !s.occupied
        ;(s.ring.material as THREE.MeshStandardMaterial).color.setHex(0xffd76a)
      } else {
        const def = CHAR_DEFS[st.selectedCharId!]
        const ok = !s.occupied && st.pahala >= def.cost
        mat.emissive.setHex(ok ? 0x7bd45f : 0xd97a7a)
        mat.emissiveIntensity = 0.45
        s.ring.visible = true
        ;(s.ring.material as THREE.MeshStandardMaterial).color.setHex(ok ? 0x9be07a : 0xe88a8a)
      }
    })
  }

  tryPlace(slotIndex: number, charId: CharId): boolean {
    const st = gameStore.get()
    if (st.screen !== 'playing') return false
    const def = CHAR_DEFS[charId]
    const slot = this.slots[slotIndex]
    if (!slot || slot.occupied) return false
    if (st.pahala < def.cost) {
      gameStore.get().showToast('Pahala belum cukup! Halau setan dulu ya 💫', '⭐', 'bad')
      return false
    }
    gameStore.set((s) => ({ ...s, pahala: s.pahala - def.cost }))
    slot.occupied = true
    const tower = this.manager.placeTower(charId, slotIndex, slot.x, slot.z, def.cost)
    tower.group.userData.towerSlot = slotIndex
    this.particles.levelUp(slot.x, 1, slot.z)
    this.particles.rings.spawn(slot.x, 0.1, slot.z, 0x9be07a, 3, 0.5)
    audio.place()
    // snap lucu: jatuh dari atas dengan bounce
    tower.group.position.y = 4
    gsap.to(tower.group.position, { y: 0, duration: 0.55, ease: 'bounce.out' })
    gameStore.set((s) => ({ ...s, selectedCharId: null, dragging: false }))
    this.cancelPlacing()
    this.refreshSlotHighlights()
    checkBadges({ event: 'towerPlaced', towersCount: this.manager.towers.length })
    return true
  }

  /* =============================== TOWER OPS =============================== */

  selectTower(tower: Tower) {
    tower.rangeRing.visible = true
    gameStore.set((s) => ({
      ...s,
      selectedTower: {
        slot: tower.slotIndex,
        char: tower.def.id,
        level: tower.level,
        canUpgrade: tower.level < 3,
        upgradeCost: tower.level < 3 ? tower.def.upgradeCosts[tower.level - 1] : 0,
        canSell: true,
        sellValue: Math.round(tower.totalSpent * GAME_CONST.sellRefund),
      },
      cameraMode: s.cameraMode === 'follow' ? 'follow' : s.cameraMode,
    }))
    audio.chime()
  }

  deselectTower() {
    this.manager.towers.forEach((t) => (t.rangeRing.visible = false))
    gameStore.set((s) => ({ ...s, selectedTower: null }))
    if (this.cameraCtrl.mode === 'follow') {
      this.setCameraMode('iso')
    }
  }

  upgradeTower() {
    const st = gameStore.get()
    if (!st.selectedTower) return
    const tower = this.manager.towers.find((t) => t.slotIndex === st.selectedTower!.slot)
    if (!tower || tower.level >= 3) return
    const cost = tower.def.upgradeCosts[tower.level - 1]
    if (st.pahala < cost) {
      st.showToast('Pahala belum cukup untuk upgrade! 🌟', '⭐', 'bad')
      return
    }
    gameStore.set((s) => ({ ...s, pahala: s.pahala - cost }))
    tower.totalSpent += cost
    const oldGroup = tower.group
    this.manager.group.remove(oldGroup)
    tower.setLevel(tower.level + 1)
    tower.group.userData.towerSlot = tower.slotIndex
    tower.rangeRing.scale.setScalar(tower.stats.range / tower.def.levels[0].range)
    tower.rangeRing.position.set(tower.group.position.x, 0, tower.group.position.z)
    tower.rangeRing.visible = true
    this.manager.group.add(tower.group)
    tower.group.position.y = 2
    gsap.to(tower.group.position, { y: 0, duration: 0.5, ease: 'bounce.out' })
    this.particles.levelUp(tower.group.position.x, 1.2, tower.group.position.z)
    audio.upgrade()
    gameStore.set((s) => ({
      ...s,
      selectedTower: {
        slot: tower.slotIndex,
        char: tower.def.id,
        level: tower.level,
        canUpgrade: tower.level < 3,
        upgradeCost: tower.level < 3 ? tower.def.upgradeCosts[tower.level - 1] : 0,
        canSell: true,
        sellValue: Math.round(tower.totalSpent * GAME_CONST.sellRefund),
      },
    }))
  }

  sellTower() {
    const st = gameStore.get()
    if (!st.selectedTower) return
    const tower = this.manager.towers.find((t) => t.slotIndex === st.selectedTower!.slot)
    if (!tower) return
    const pos = tower.group.position.clone()
    this.manager.removeTower(tower)
    this.slots[tower.slotIndex].occupied = false
    gameStore.set((s) => ({ ...s, pahala: s.pahala + st.selectedTower!.sellValue, selectedTower: null }))
    this.particles.deathPoof(pos.x, 0.8, pos.z)
    this.particles.showPahala(pos.x, 1.5, pos.z, st.selectedTower.sellValue)
    audio.pop()
    this.refreshSlotHighlights()
  }

  followSelected() {
    const st = gameStore.get()
    if (!st.selectedTower) return
    const tower = this.manager.towers.find((t) => t.slotIndex === st.selectedTower!.slot)
    if (!tower) return
    this.setCameraMode('follow')
    this.cameraCtrl.setFollowTarget(tower.pos)
  }

  /* =============================== CAMERA =============================== */

  setCameraMode(mode: CameraMode) {
    this.cameraCtrl.setMode(mode)
    gameStore.set((s) => ({
      ...s,
      cameraMode: mode,
      hudHidden: mode === 'photo',
    }))
  }

  rotateCamera(dir: 1 | -1) {
    this.cameraCtrl.rotateBy(dir * Math.PI / 4)
  }

  /* ---- P2: navigasi kamera dari tombol UI (mobile D-pad) ---- */
  panCamera(dx: number, dz: number) {
    this.cameraCtrl.panBy(dx, dz)
  }

  zoomCamera(delta: number) {
    this.cameraCtrl.zoomBy(delta)
  }

  recenterCamera() {
    this.cameraCtrl.recenter()
  }

  screenshot() {
    try {
      if (this.usePost && this.composer) this.composer.render()
      else this.renderer.render(this.scene, this.cameraCtrl.camera)
      const url = this.canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'penjaga-masjid-foto.png'
      a.click()
      audio.tada()
      gameStore.get().showToast('Foto disimpan! Jepretan keren 📸', '📸', 'good')
      // kilatan kamera
      const flash = document.createElement('div')
      flash.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0.85;z-index:9999;pointer-events:none;transition:opacity .5s'
      document.body.appendChild(flash)
      requestAnimationFrame(() => (flash.style.opacity = '0'))
      setTimeout(() => flash.remove(), 600)
    } catch {
      gameStore.get().showToast('Aduh, foto gagal disimpan 😅', '📸', 'bad')
    }
  }

  /* =============================== GAME FLOW =============================== */

  startGame(opts?: { daily?: boolean; forceTutorial?: boolean; levelId?: number }) {
    audio.ensure()
    audio.setSound(gameStore.get().soundOn)
    audio.setMusic(gameStore.get().musicOn)
    audio.startBgm()
    this.clearDuaOverlay()
    gameStore.get().resetForNewGame()

    /* ---- P3: Level Select — konfigurasi level aktif ---- */
    const level = opts?.levelId ? getLevel(opts.levelId) : undefined
    this.levelWaves = level ? levelWaves(level.id) : WAVES

    /* ---- Tantangan Harian: terapkan modifier tanggal hari ini ---- */
    resetRunMods()
    this.dailyKeyRun = null
    let maxHp = level ? level.mosqueHp : GAME_CONST.mosqueMaxHp
    let startPahala = level ? level.startPahala : GAME_CONST.startPahala
    let dailyMod: DailyModifier | null = null
    if (opts?.daily) {
      const key = dailyKey()
      dailyMod = pickDailyModifier(key)
      applyDailyMods(dailyMod)
      maxHp += dailyMod.mosqueHpBonus ?? 0
      startPahala += dailyMod.startPahalaBonus ?? 0
      this.dailyKeyRun = key
    }

    gameStore.set((s) => ({
      ...s,
      pahala: startPahala,
      mosqueHp: maxHp,
      mosqueMaxHp: maxHp,
      dailyMode: !!opts?.daily,
      dailyMod,
      tutorialStep: 0,
      levelId: level?.id ?? 0,
      totalWaves: this.levelWaves.length,
    }))
    this.manager.reset()
    this.slots.forEach((s) => (s.occupied = false))
    this.spawnEvents = []
    this.waveElapsed = 0
    this.spawnCursor = 0
    this.victoryTimer = 0
    this.misbahGenTotal = 0
    this.tutTimer = 0
    gameStore.set((s) => ({ ...s, nextWaveIn: GAME_CONST.firstWaveDelay }))
    this.setCameraMode('iso')
    this.refreshSlotHighlights()
    this.updateWavePreview(1)

    if (opts?.daily && dailyMod) {
      gameStore
        .get()
        .showToast(`TANTANGAN HARI INI: ${dailyMod.emoji} ${dailyMod.name}!`, '🔥', 'info')
      gsap.delayedCall(1.4, () =>
        gameStore.get().showToast(dailyMod ? dailyMod.desc : '', dailyMod ? dailyMod.emoji : '🔥', 'info'),
      )
    } else {
      /* ---- Tutorial interaktif saat pertama kali main ---- */
      if (opts?.forceTutorial || !isTutorialSeen()) {
        this.tutTimer = 0
        gameStore.set((s) => ({ ...s, tutorialStep: 1 }))
      }
      gameStore.get().showToast('Taruh Ali di dekat jalur setan, ya! 🧒', '🤲', 'info')
    }
  }

  backToMenu() {
    this.clearDuaOverlay()
    gameStore.set((s) => ({
      ...s,
      screen: 'menu',
      // bersihkan popup yang bisa nyangkut di menu (fun fact / toast / lencana)
      funFact: null,
      toast: null,
      badgeToast: null,
      selectedTower: null,
      selectedCharId: null,
      dragging: false,
      paused: false,
      bossHp: null,
      tutorialStep: 0,
      coachTips: null,
      dailyMode: false,
      dailyMod: null,
      levelId: 0,
      totalWaves: 10,
    }))
    this.levelWaves = WAVES
    this.manager.reset()
    this.slots.forEach((s) => (s.occupied = false))
    this.setCameraMode('menu')
    audio.stopBgm()
  }

  startWaveNow() {
    const st = gameStore.get()
    if (st.waveActive || st.screen !== 'playing') return
    this.beginWave()
  }

  private beginWave() {
    const st = gameStore.get()
    const waveNum = st.wave + 1
    const waveDef = this.levelWaves[waveNum - 1]
    if (!waveDef) return

    gameStore.set((s) => ({ ...s, wave: waveNum, waveActive: true, nextWaveIn: 0 }))
    this.waveElapsed = 0
    this.spawnCursor = 0
    this.spawnEvents = []
    let laneRot = this.laneCursor
    waveDef.spawns.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        const t = (group.delay ?? 0) + i * group.interval
        const lane = waveDef.isBoss && group.type === 'banaspati' ? 1 : laneRot % LANES.length
        laneRot++
        this.spawnEvents.push({ time: t, enemyId: group.type, lane })
      }
    })
    this.spawnEvents.sort((a, b) => a.time - b.time)
    this.laneCursor = laneRot

    // unlock karakter baru
    Object.values(CHAR_DEFS).forEach((def) => {
      if (def.unlockWave <= waveNum && !st.unlockedChars.includes(def.id)) {
        st.unlockChar(def.id)
        st.showFunFact(def.id, def.funFact)
        audio.tada()
      }
    })

    if (waveDef.isBoss) {
      audio.bossNgambek()
      st.showToast('BANASPATI NGAMBEK DATANG! Siap-siap, ya! 🔥', '🔥', 'bad')
      this.cameraCtrl.bossIntroThenReturn()
      gameStore.set((s) => ({ ...s, cameraMode: 'boss' }))
      gsap.delayedCall(3.4, () => {
        if (gameStore.get().cameraMode === 'boss') this.setCameraMode('iso')
      })
    } else {
      audio.cheer()
      st.showToast(`Gelombang ${waveNum} dimulai! Semangat! 💪`, '🛡️', 'info')
    }
    this.updateWavePreview(waveNum + 1)
  }

  private updateWavePreview(waveNum: number) {
    const waveDef = this.levelWaves[waveNum - 1]
    if (!waveDef) {
      gameStore.set((s) => ({ ...s, wavePreview: [] }))
      return
    }
    const agg = new Map<EnemyId, number>()
    waveDef.spawns.forEach((g) => agg.set(g.type, (agg.get(g.type) ?? 0) + g.count))
    const preview = Array.from(agg.entries()).map(([type, count]) => ({
      emoji: ENEMY_DEFS[type].emoji,
      count,
    }))
    gameStore.set((s) => ({ ...s, wavePreview: preview }))
  }

  private onWaveComplete() {
    const st = gameStore.get()
    const waveNum = st.wave
    const waveDef = WAVES[waveNum - 1]
    gameStore.set((s) => ({
      ...s,
      waveActive: false,
      pahala: s.pahala + waveDef.reward,
      stats: { ...s.stats, wavesCleared: waveNum },
    }))
    this.particles.showPahala(0, 6, 10, waveDef.reward)
    audio.tada()
    st.showToast(`Gelombang ${waveNum} aman! +${waveDef.reward} pahala 🌟`, '🎉', 'good')
    // energi doa bonus tiap gelombang selesai
    st.addDuaCharge(DUA_CONST.perWave)
    checkBadges({ event: 'waveComplete', wave: waveNum })
    checkBadges({ event: 'pahalaChanged', pahala: st.pahala + waveDef.reward })

    // tips edukatif santai
    if (waveNum % 2 === 0) {
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)]
      gsap.delayedCall(1.6, () => gameStore.get().showToast(tip, '💡', 'info'))
    }

    if (waveNum >= this.levelWaves.length) {
      this.onVictory()
      return
    }
    gameStore.set((s) => ({ ...s, nextWaveIn: GAME_CONST.betweenWaveDelay }))
    this.updateWavePreview(waveNum + 1)
  }

  private onVictory() {
    const st = gameStore.get()
    const stars = computeStars(st.mosqueHp, st.mosqueMaxHp)
    gameStore.set((s) => ({ ...s, screen: 'victory', resultStars: stars, funFact: null }))
    audio.stopBgm()
    audio.cheer()
    audio.tada()
    this.setCameraMode('menu')
    this.victoryTimer = 0
    this.victoryFxTimer = 0
    this.clearDuaOverlay()
    checkBadges({ event: 'victory', stars, pahala: st.stats.starsEarned })
    recordSessionEnd(st.stats.starsEarned)
    clearLossStreak()
    /* ---- P3: Level Select — catat rating & buka level berikutnya ---- */
    if (st.levelId > 0) {
      recordLevelResult(st.levelId, stars)
    }
    /* ---- P4: hadiah bintang toko dari pahala run (20 pahala = 1 ⭐) ---- */
    this.runStarGain = grantRunReward(st.stats.starsEarned)
    /* ---- Tantangan Harian menang → catat streak ---- */
    if (st.dailyMode && this.dailyKeyRun) {
      const streak = recordDailyWin(this.dailyKeyRun)
      checkBadges({ event: 'dailyWin' })
      gameStore.set((s) => ({ ...s, dailyStreakResult: streak }))
      this.particles.rings.spawn(0, 0.12, 0, 0xff8a5c, 22, 1.6)
    }
  }

  private onGameOver() {
    const st = gameStore.get()
    gameStore.set((s) => ({ ...s, screen: 'gameover', funFact: null }))
    audio.stopBgm()
    audio.mosqueHit()
    this.clearDuaOverlay()
    checkBadges({ event: 'gameOver' })
    recordSessionEnd(st.stats.starsEarned)
    /* ---- Saran strategi personal dari "Kakek Imam" ---- */
    const lossStreak = bumpLossStreak()
    gameStore.set((s) => ({ ...s, coachTips: this.buildCoachTips(st, lossStreak) }))
    // setan lari senang (bukan dramatic)
    this.manager.enemies.forEach((e) => {
      e.fleeing = true
    })
    gameStore.get().showToast('Setan-setan lari senang-senang~ 😄', '👻', 'info')
  }

  /** Analisis gaya main untuk saran personal di layar kalah (semua positif). */
  private buildCoachTips(st: ReturnType<typeof gameStore.get>, lossStreak: number): string[] {
    const towers = this.manager.towers
    const tips: string[] = []
    if (lossStreak >= 2) {
      tips.push('Kakek lihat kamu kesulitan — mulai dengan 3-4 penjaga dulu, baru upgrade pelan-pelan ya 🤗')
    }
    if (towers.length < 6) {
      tips.push('Pasang lebih banyak penjaga — sebar di TIGA jalur (kiri, tengah, kanan) agar tidak ada yang lolos 🗺️')
    }
    const maxed = towers.filter((t) => t.level >= 3).length
    if (maxed === 0 && towers.length > 0) {
      tips.push('Nabung pahala untuk UPGRADE bintang ⭐ — penjaga level 3 jauh lebih kuat lho!')
    }
    const hasMisbah = towers.some((t) => t.def.id === 'misbah')
    if (!hasMisbah && st.wave >= 4) {
      tips.push('Coba pasang Misbah 💡 — kotak sedekahnya menghasilkan pahala otomatis tiap beberapa detik!')
    }
    if (st.duaUsedThisGame === 0) {
      tips.push('Tekan DOA BERSAMA 🤲 saat energinya penuh — SEMUA penjaga ikut diberkahi, hebat sekali!')
    }
    if (st.wave >= 8) {
      tips.push('Sedikit lagi! Kakek Imam 📢 serangannya kena SEMUA setan — pasang 2-3 beliau untuk gelombang akhir!')
    }
    if (tips.length === 0) {
      tips.push('Kamu sudah bermain bagus! Rapikan posisi penjaga & upgrade pelan-pelan ya 😊')
    }
    return tips.slice(0, 3)
  }

  /* =============================== DOA BERSAMA =============================== */

  /** Aktifkan kekuatan spesial Doa Bersama (dipanggil tombol UI). */
  activateDua() {
    const st = gameStore.get()
    if (!st.duaReady || st.screen !== 'playing' || st.paused) return

    // berkah untuk semua tower
    this.manager.activateDuaBlessing(DUA_CONST.duration)
    // setan jadi lambat & khusyuk (kecuali kuyang yang melayang bebas)
    this.manager.enemies.forEach((e) => {
      if (!e.dead && !e.leaked && !e.escaped && !e.def.slowImmune) {
        e.slowUntil = this.manager.now + DUA_CONST.duration
        e.slowFactor = Math.min(e.slowFactor, DUA_CONST.enemySlow)
      }
    })
    // masjid dipulihkan sedikit
    const healed = Math.min(st.mosqueMaxHp, st.mosqueHp + DUA_CONST.heal)
    if (healed > st.mosqueHp) {
      gameStore.set((s) => ({ ...s, mosqueHp: healed }))
      this.particles.showDamage(0, 7.5, 6, DUA_CONST.heal, '#4ade80')
    }

    /* --- VFX: cahaya keemasan dari kubah masjid --- */
    this.particles.rings.spawn(0, 0.12, 0, 0xffd76a, 16, 1.2)
    this.particles.rings.spawn(0, 0.12, 0, 0xfff3c9, 10, 0.8)
    this.particles.adzanWave(0, 9, 0)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      this.particles.sparkleRise(Math.cos(a) * 3.5, 6 + Math.random() * 4, Math.sin(a) * 3.5)
    }
    // cincin berkah di setiap tower
    this.manager.towers.forEach((t) => {
      this.particles.rings.spawn(t.pos.x, 0.1, t.pos.z, 0xffd76a, 2.4, 0.7)
    })

    // suara arpeggio harpa + sorak
    audio.duaBlessing()

    // overlay cahaya keemasan di layar
    this.showDuaOverlay()

    // state UI
    st.consumeDuaCharge()
    gameStore.set((s) => ({ ...s, duaUsedThisGame: s.duaUsedThisGame + 1 }))
    st.showToast('DOA BERSAMA! Semua anak sholeh ber semangat barakah! ✨', '🤲', 'good')
    checkBadges({ event: 'duaUsed' })
  }

  private showDuaOverlay() {
    this.clearDuaOverlay()
    const el = document.createElement('div')
    el.className = 'dua-glow-overlay'
    document.body.appendChild(el)
    this.duaOverlay = el
  }

  private clearDuaOverlay() {
    if (this.duaOverlay) {
      this.duaOverlay.remove()
      this.duaOverlay = null
    }
  }

  /* =============================== CALLBACKS =============================== */

  private onEnemyKilled(reward: number, pos: THREE.Vector3, enemyId: EnemyId) {
    const st = gameStore.get()
    const rewardAdj = Math.round(reward * RUN_MODS.rewardMult)
    gameStore.set((s) => ({
      ...s,
      pahala: s.pahala + rewardAdj,
      stats: { ...s.stats, defeated: s.stats.defeated + 1, starsEarned: s.stats.starsEarned + rewardAdj },
    }))
    this.particles.showPahala(pos.x, 2.4, pos.z, rewardAdj)
    // energi Doa Bersama naik saat setan dihalau
    st.addDuaCharge(DUA_CONST.perKill)
    checkBadges({ event: 'enemyKilled', enemyId })
    checkBadges({ event: 'pahalaChanged', pahala: st.pahala + rewardAdj })
  }

  private onEnemyLeaked(enemy: Enemy) {
    const st = gameStore.get()
    const def = enemy.def
    let dmg = def.damage
    if (def.steals) {
      const steals = Math.round(def.steals * RUN_MODS.stealMult)
      gameStore.set((s) => ({ ...s, pahala: Math.max(0, s.pahala - steals) }))
      this.particles.stealFx(enemy.pos.x, 1, enemy.pos.z)
      audio.steal()
      st.showToast(`Tuyul usil mencuri ${steals} pahala! 🪙`, '😤', 'bad')
      dmg = def.damage
    } else {
      audio.mosqueHit()
    }
    // masjid goyang lucu
    gsap.fromTo(this.mosque.group.rotation, { z: 0.05 }, { z: 0, duration: 0.7, ease: 'elastic.out(2.2, 0.4)' })
    this.particles.rings.spawn(0, 0.15, 0, 0xff9ecb, 6, 0.6)
    const hp = Math.max(0, st.mosqueHp - dmg)
    gameStore.set((s) => ({ ...s, mosqueHp: hp }))
    if (this.mosqueToastCd <= 0) {
      this.mosqueToastCd = 6
      st.showToast('Setan mengganggu masjid! Yuk halau mereka! 🕌', '😱', 'bad')
    }
    if (hp <= 0) {
      this.onGameOver()
    }
  }

  private onBossShockwave(duration: number) {
    this.manager.towers.forEach((t) => t.stun(this.manager.now, duration))
    gameStore.get().showToast('Banaspati ngamuk! Karaktermu kaget sebentar 😵', '🔥', 'bad')
  }

  /** Misbah: koin sedekah masuk — pahala naik + VFX koin lucu. */
  private onPahalaTick(amount: number, pos: THREE.Vector3, level: number) {
    const st = gameStore.get()
    if (st.screen !== 'playing') return
    this.misbahGenTotal += amount
    gameStore.set((s) => ({ ...s, pahala: s.pahala + amount }))
    // VFX: koin kecil melompat dari kotak sedekah + angka mengapung
    this.particles.showPahala(pos.x, 1.6, pos.z, amount)
    this.particles.rings.spawn(pos.x, 0.1, pos.z, 0xffd76a, 1.6 + level * 0.2, 0.5)
    if (this.sedekahSoundCd <= 0) {
      this.sedekahSoundCd = 1.2
      audio.coin()
    }
    checkBadges({ event: 'sedekahTick', misbahGen: this.misbahGenTotal })
  }

  /* =============================== LOOP =============================== */

  private loop = () => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.loop)
    this.frameCount++

    const now = performance.now()
    let dt = (now - this.lastFrameTime) / 1000
    this.lastFrameTime = now
    dt = Math.min(dt, 0.05) // clamp agar tidak lompat saat tab tidak aktif

    this.simTick(dt, now)

    /* ---- render ---- */
    if (this.usePost && this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.cameraCtrl.camera)
    }
  }

  /** Satu langkah logika game (dipisah dari render agar bisa diuji otomatis). */
  private simTick(dt: number, now = performance.now()) {
    this.elapsed += dt
    const st = gameStore.get()
    const gameDt = st.screen === 'playing' && !st.paused ? dt * st.speed : 0

    /* ---- logika game ---- */
    if (gameDt > 0) {
      if (st.waveActive) {
        this.waveElapsed += gameDt
        // spawn sesuai jadwal
        while (this.spawnCursor < this.spawnEvents.length) {
          const ev = this.spawnEvents[this.spawnCursor]
          if (ev.time > this.waveElapsed) break
          if (this.manager.aliveEnemyCount >= GAME_CONST.maxEnemies) {
            ev.time += 0.5 // tunda bila terlalu ramai
            break
          }
          this.manager.spawnEnemy(ev.enemyId, ev.lane, st.wave)
          this.spawnCursor++
        }
        if (this.spawnCursor >= this.spawnEvents.length && this.manager.aliveEnemyCount === 0) {
          this.onWaveComplete()
        }
      } else if (st.nextWaveIn > 0) {
        const next = st.nextWaveIn - gameDt
        gameStore.set((s) => ({ ...s, nextWaveIn: next }))
        if (next <= 0) this.beginWave()
      }

      this.manager.update(gameDt)

      // HP boss ke UI
      const boss = this.manager.enemies.find((e) => e.def.isBoss && !e.dead && !e.leaked)
      if (boss) {
        gameStore.set((s) => (s.bossHp === boss.hp ? s : { ...s, bossHp: boss.hp, bossMaxHp: boss.maxHp }))
      } else if (st.bossHp !== null) {
        gameStore.set((s) => ({ ...s, bossHp: null }))
      }

      // hitung mundur berkah Doa Bersama
      if (st.duaActive > 0) {
        st.tickDuaActive(gameDt)
        const stillBlessed = this.manager.duaBlessed
        if (!stillBlessed && this.duaOverlay) {
          this.clearDuaOverlay()
          gameStore.get().showToast('Berkah doa selesai — kumpulkan lagi ya! 🤲', '✨', 'info')
        }
      }

      // tutorial interaktif — maju sesuai aksi pemain sungguhan
      if (st.tutorialStep > 0) this.updateTutorial(gameDt, st)
    } else {
      // saat pause/menu tetap animasikan manager minimal (idle tower)
      this.manager.update(0)
    }

    this.mosqueToastCd -= dt
    this.sedekahSoundCd -= dt

    /* ---- ambient ceria (selalu jalan) ---- */
    this.updateAmbient(dt, st.screen)

    /* ---- P1: animasi air dunia luas ---- */
    this.worldExp?.update(this.elapsed)

    /* ---- partikel & kamera ---- */
    this.particles.update(dt)
    this.cameraCtrl.update(dt)

    // aura berkah masjid: cahaya keemasan naik dari kubah
    this.auraTimer -= dt
    if (this.auraTimer <= 0) {
      this.auraTimer = 0.14
      this.particles.sparkleRise((Math.random() - 0.5) * 3.4, 9 + Math.random() * 2.2, (Math.random() - 0.5) * 3.4)
    }

    // denyut lampu hias masjid
    const lanternMat = this.mosque.parts.lanterns[0]?.material as THREE.MeshStandardMaterial | undefined
    if (lanternMat) {
      lanternMat.emissiveIntensity = 1.3 + Math.sin(now * 0.003) * 0.45
    }
    this.mosque.parts.domeLight.intensity = 12 + Math.sin(now * 0.002) * 3
  }

  /** QA/debug: majukan simulasi beberapa detik TANPA render (untuk pengujian otomatis). */
  advance(seconds: number) {
    const step = 0.05
    const n = Math.max(1, Math.round(seconds / step))
    for (let i = 0; i < n; i++) {
      this.simTick(step)
    }
  }

  /* ============================ TUTORIAL INTERAKTIF ============================ */

  /** Lewati tutorial dari tombol UI — tetap dianggap selesai. */
  skipTutorial() {
    if (gameStore.get().tutorialStep <= 0) return
    this.finishTutorial()
    gameStore.get().showToast('Tutorial selesai! Semangat bermain ya! 🎓', '🎓', 'good')
  }

  private setTutStep(n: number) {
    this.tutTimer = 0
    gameStore.set((s) => ({ ...s, tutorialStep: n }))
    audio.chime()
  }

  private finishTutorial() {
    gameStore.set((s) => ({ ...s, tutorialStep: 0 }))
    markTutorialDone()
    checkBadges({ event: 'tutorialDone' })
  }

  /** Langkah tutorial maju berdasarkan state game nyata (bukan timer saja). */
  private updateTutorial(dt: number, st: ReturnType<typeof gameStore.get>) {
    if (st.screen !== 'playing' || st.paused) return
    this.tutTimer += dt
    switch (st.tutorialStep) {
      case 1: // tunggu pilih kartu
        if (st.selectedCharId) this.setTutStep(2)
        break
      case 2: // tunggu pasang tower
        if (this.manager.towers.length >= 1) this.setTutStep(3)
        break
      case 3: // tunggu mulai gelombang
        if (st.waveActive && st.wave >= 1) this.setTutStep(4)
        break
      case 4: // info serangan — lanjut setelah kill pertama (atau mundur)
        if (st.stats.defeated >= 1 || this.tutTimer > 30 || st.wave >= 2) this.setTutStep(5)
        break
      case 5: // info DOA — lanjut saat siap / dipakai / timeout
        if (st.duaReady || st.duaUsedThisGame > 0 || this.tutTimer > 16 || st.wave >= 2) this.setTutStep(6)
        break
      case 6: // penutup
        if (this.tutTimer > 8 || st.wave >= 2) this.finishTutorial()
        break
    }
  }

  private updateAmbient(dt: number, screen: string) {
    // awan melayang
    for (const c of this.critters) {
      c.t += dt
      if (c.type === 'cloud') {
        c.group.position.x += c.speed * dt
        if (c.group.position.x > 55) c.group.position.x = -55
      } else if (c.type === 'bird') {
        const a = c.t * c.speed + c.phase
        c.group.position.set(Math.cos(a) * c.radius, c.height + Math.sin(a * 2.3) * 1.5, Math.sin(a) * c.radius * 0.7)
        c.group.rotation.y = -a + Math.PI / 2
        const { wl, wr } = c.group.userData as { wl: THREE.Mesh; wr: THREE.Mesh }
        wl.rotation.z = Math.sin(c.t * 9) * 0.7
        wr.rotation.z = -Math.sin(c.t * 9) * 0.7
      } else if (c.type === 'butterfly') {
        const a = c.t * c.speed + c.phase
        const r = c.radius
        c.group.position.set(Math.cos(a * 1.3) * r, c.height + Math.sin(a * 5) * 0.4, Math.sin(a) * r * 0.8)
        c.group.rotation.y = -a * 1.3 + Math.PI / 2
        const { wl, wr } = c.group.userData as { wl: THREE.Mesh; wr: THREE.Mesh }
        wl.rotation.z = Math.sin(c.t * 14) * 0.85
        wr.rotation.z = -Math.sin(c.t * 14) * 0.85
      }
    }

    // anak-anak jalan-jalan / menari kemenangan
    for (const w of this.wanderers) {
      w.phase += dt
      const isVictory = screen === 'victory'
      if (isVictory) {
        w.group.position.y = Math.abs(Math.sin(w.phase * 6)) * 0.5
        w.group.rotation.y += dt * 3
      } else {
        const dir = w.target.clone().sub(w.group.position)
        dir.y = 0
        if (dir.length() < 0.3) {
          w.target = this.randomCourtyardPoint()
        } else {
          dir.normalize()
          w.group.position.addScaledVector(dir, w.speed * dt)
          const targetRot = Math.atan2(dir.x, dir.z)
          let d = targetRot - w.group.rotation.y
          while (d > Math.PI) d -= Math.PI * 2
          while (d < -Math.PI) d += Math.PI * 2
          w.group.rotation.y += d * Math.min(1, dt * 6)
          w.group.position.y = Math.abs(Math.sin(w.phase * 7)) * 0.12
        }
      }
      // menari juga untuk tower saat menang
      const parts = w.group.userData.parts as { armL: THREE.Object3D; armR: THREE.Object3D } | undefined
      if (parts) {
        const wv = isVictory ? Math.sin(w.phase * 8) * 1.2 : Math.sin(w.phase * 2.5) * 0.15
        parts.armL.rotation.z = 0.5 + wv
        parts.armR.rotation.z = -0.5 - wv
      }
    }

    // tower ikut menari saat kemenangan
    if (screen === 'victory') {
      for (const t of this.manager.towers) {
        t.group.position.y = Math.abs(Math.sin(this.elapsed * 5 + t.slotIndex)) * 0.35
        t.group.rotation.y += dt * 2
      }
      // kembang api warna-warni di atas masjid
      this.victoryFxTimer -= dt
      if (this.victoryFxTimer <= 0) {
        this.victoryFxTimer = 0.45
        const colors = [0xff9ecb, 0xffd166, 0x9ff2c8, 0xa8e6ff, 0xc39bff, 0xff8f6b]
        this.particles.firework(
          (Math.random() - 0.5) * 24,
          14 + Math.random() * 6,
          (Math.random() - 0.5) * 14,
          colors[Math.floor(Math.random() * colors.length)],
        )
        if (Math.random() < 0.5) audio.firework()
      }
    }
  }

  /* =============================== RESIZE & DISPOSE =============================== */

  resize = () => {
    const parent = this.canvas.parentElement
    if (!parent) return
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w === 0 || h === 0) return
    this.renderer.setSize(w, h, false)
    this.cameraCtrl.resize(w / h)
    this.composer?.setSize(w, h)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.clearDuaOverlay()
    const c = this.canvas
    c.removeEventListener('pointerdown', this.onPointerDown)
    c.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    c.removeEventListener('wheel', this.onWheel)
    c.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('resize', this.resize)
    gsap.globalTimeline.clear()
    audio.stopBgm()
    this.composer?.dispose?.()
    this.renderer.dispose()
  }
}

/* ------------------------- singleton akses UI ------------------------- */

let engineInstance: GameEngine | null = null

export function setEngineInstance(e: GameEngine | null) {
  engineInstance = e
}

export function getEngine(): GameEngine | null {
  return engineInstance
}
