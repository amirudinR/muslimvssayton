/* ============================================================
 * PENJAGA MASJID — CameraController
 * Mode: menu (auto-orbit), iso (top-down pan/zoom ramah anak),
 * follow (ikuti karakter, bouncy), photo (orbit bebas + screenshot),
 * boss (intro sinematik lucu). Transisi via GSAP ease bouncy.
 *
 * P2: drag dgn INERTIA (meluncur saat dilepas), zoom damping
 * halus (scroll & pinch), panClamp per mode, recenter() untuk
 * tombol navigasi mobile.
 * ============================================================ */

import * as THREE from 'three'
import gsap from 'gsap'
import type { CameraMode } from './store'

interface CamState {
  tx: number
  ty: number
  tz: number
  azimuth: number // sudut sekitar sumbu Y
  elevation: number // sudut dari tanah (radian)
  dist: number
}

/** Batas pan — world baru jauh lebih luas, tapi tetap dibatasi. */
const BOUNDS = { x: 88, z: 62 }
/** Posisi default (recenter). */
const HOME = { x: 0, z: 2, dist: 40, elevation: 0.98 }

/** P3: sensitivitas kamera dari settings (0.3..2.2), default 1 */
export function readDragSens(): number {
  if (typeof window === 'undefined') return 1
  const v = Number(window.localStorage.getItem('pm-drag-sens'))
  return Number.isFinite(v) && v > 0 ? v / 100 : 1
}
export function readZoomSens(): number {
  if (typeof window === 'undefined') return 1
  const v = Number(window.localStorage.getItem('pm-zoom-sens'))
  return Number.isFinite(v) && v > 0 ? v / 100 : 1
}

export class CameraController {
  camera: THREE.PerspectiveCamera
  mode: CameraMode = 'menu'
  private state: CamState = { tx: 0, ty: 2, tz: 2, azimuth: 0, elevation: 0.95, dist: 40 }
  private smoothTarget = new THREE.Vector3(0, 2, 2)
  private followPos: THREE.Vector3 | null = null
  private dragBtn = -1
  private lastX = 0
  private lastY = 0
  private bobT = 0
  private menuT = 0
  private tmp = new THREE.Vector3()
  private tween: gsap.core.Tween | null = null

  /* ---------- P2: inertia / momentum ---------- */
  /** kecepatan pan saat drag (unit/detik) — dipakai untuk momentum */
  private velX = 0
  private velZ = 0
  /** momentum aktif setelah drag dilepas */
  private momentumT = 0
  /** zoom halus: target dist yang di-lerp (damping) */
  private targetDist = 40

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 480)
    this.applyState(1)
    this.targetDist = this.state.dist
  }

  resize(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  /* ------------------------------ mode ------------------------------ */

  setMode(mode: CameraMode, instant = false) {
    this.mode = mode
    this.followPos = null
    this.tween?.kill()
    const dur = instant ? 0 : 1.1
    if (mode === 'menu') {
      this.tween = gsap.to(this.state, {
        tx: 0, ty: 4, tz: 0, elevation: 0.62, dist: 36,
        duration: dur, ease: 'power2.inOut',
      })
    } else if (mode === 'iso') {
      this.tween = gsap.to(this.state, {
        tx: 0, ty: 1, tz: 2, elevation: 0.98, dist: 40,
        duration: dur, ease: 'back.out(1.2)',
      })
    } else if (mode === 'photo') {
      this.tween = gsap.to(this.state, {
        ty: 3, elevation: 0.55, dist: 30,
        duration: dur, ease: 'back.out(1.3)',
      })
    } else if (mode === 'follow') {
      this.tween = gsap.to(this.state, {
        elevation: 0.55, dist: 11,
        duration: 0.9, ease: 'elastic.out(1, 0.7)',
      })
    } else if (mode === 'boss') {
      this.tween = gsap.to(this.state, {
        tx: 0, ty: 2, tz: -14, elevation: 0.45, dist: 16,
        duration: 1.0, ease: 'back.out(1.6)',
      })
    }
    if (instant) this.applyState(1)
  }

  setFollowTarget(pos: THREE.Vector3 | null) {
    this.followPos = pos
    if (pos && this.mode === 'follow') {
      this.tween?.kill()
      this.tween = gsap.to(this.state, {
        tx: pos.x, tz: pos.z, ty: 1,
        elevation: 0.55, dist: 11,
        duration: 1.0, ease: 'elastic.out(1, 0.7)',
      })
    }
  }

  /** Kamera bos intro lalu kembali ke iso. */
  bossIntroThenReturn() {
    this.setMode('boss')
    gsap.delayedCall(3.2, () => {
      if (this.mode === 'boss') this.setMode('iso')
    })
  }

  /* --------------------------- input pointer --------------------------- */

  onPointerDown(x: number, y: number, button: number) {
    this.dragBtn = button
    this.lastX = x
    this.lastY = y
    this.tween?.kill()
    this.stopMomentum()
  }

  onPointerMove(x: number, y: number): boolean {
    const dx = x - this.lastX
    const dy = y - this.lastY
    this.lastX = x
    this.lastY = y
    if (this.dragBtn < 0) return false

    if (this.mode === 'photo' || this.mode === 'boss') {
      // orbit bebas
      this.state.azimuth -= dx * 0.005
      this.state.elevation = THREE.MathUtils.clamp(this.state.elevation + dy * 0.004, 0.18, 1.4)
      return true
    }
    if (this.mode === 'iso' || this.mode === 'menu') {
      // pan di bidang tanah (kecepatan skala dist × sensitivitas)
      const panSpeed = this.state.dist * 0.0016 * readDragSens()
      const cos = Math.cos(this.state.azimuth)
      const sin = Math.sin(this.state.azimuth)
      // geser tegak lurus arah pandang
      const mx = -dx * panSpeed
      const mz = dy * panSpeed
      const wx = mx * cos - mz * sin
      const wz = mx * sin + mz * cos
      this.panBy(wx, wz)
      // catat kecepatan untuk momentum (dengan smoothing eksponensial)
      this.velX = THREE.MathUtils.lerp(this.velX, wx * 60, 0.28)
      this.velZ = THREE.MathUtils.lerp(this.velZ, wz * 60, 0.28)
      this.momentumT = 0.16 // jendela "baru saja drag"
      return true
    }
    return false
  }

  onPointerUp() {
    this.dragBtn = -1
    // momentum hanya kalau kecepatan cukup terasa
    if (Math.hypot(this.velX, this.velZ) < 4) {
      this.stopMomentum()
    } else {
      this.momentumT = 0.85 // durasi luncuran (detik)
    }
  }

  /** Batalkan momentum (dipakai saat pointer baru menyentuh). */
  stopMomentum() {
    this.velX = 0
    this.velZ = 0
    this.momentumT = 0
  }

  /** Geser target pan (dengan clamp BOUNDS). */
  panBy(wx: number, wz: number) {
    this.state.tx = THREE.MathUtils.clamp(this.state.tx + wx, -BOUNDS.x, BOUNDS.x)
    this.state.tz = THREE.MathUtils.clamp(this.state.tz + wz, -BOUNDS.z, BOUNDS.z)
  }

  /** Geser mengikuti arah layar, bukan sumbu dunia setelah kamera berputar. */
  panScreenBy(dx: number, dz: number) {
    const cos = Math.cos(this.state.azimuth)
    const sin = Math.sin(this.state.azimuth)
    this.panBy(dx * cos - dz * sin, dx * sin + dz * cos)
  }

  /** Zoom dengan damping halus — target di-lerp di update(). */
  zoomBy(delta: number): boolean {
    if (this.mode === 'boss') return false
    const min = this.mode === 'photo' ? 10 : this.mode === 'follow' ? 8 : 16
    const max = this.mode === 'photo' ? 80 : this.mode === 'follow' ? 20 : 58
    this.targetDist = THREE.MathUtils.clamp(this.targetDist + delta * readZoomSens(), min, max)
    return true
  }

  /** Pinch-to-zoom: rasio jarak dua jari → delta dist. */
  applyPinch(scaleRatio: number) {
    if (this.mode === 'boss') return
    // scaleRatio > 1 → jari membuka → zoom in (dist mengecil)
    const delta = (1 - scaleRatio) * this.state.dist * 0.9
    const min = this.mode === 'photo' ? 10 : this.mode === 'follow' ? 8 : 16
    const max = this.mode === 'photo' ? 80 : this.mode === 'follow' ? 20 : 58
    this.targetDist = THREE.MathUtils.clamp(this.targetDist + delta, min, max)
  }

  onWheel(delta: number): boolean {
    return this.zoomBy(delta * 0.5)
  }

  rotateBy(delta: number) {
    this.tween?.kill()
    this.stopMomentum()
    gsap.to(this.state, {
      azimuth: this.state.azimuth + delta,
      duration: 0.7,
      ease: 'back.out(1.8)',
    })
  }

  /** P2: kembali ke posisi default papan (tombol Recenter mobile). */
  recenter() {
    this.tween?.kill()
    this.stopMomentum()
    this.followPos = null
    if (this.mode === 'iso') {
      this.tween = gsap.to(this.state, {
        tx: HOME.x, tz: HOME.z, azimuth: 0, elevation: HOME.elevation, dist: HOME.dist,
        duration: 0.85, ease: 'back.out(1.4)',
      })
    } else {
      this.tween = gsap.to(this.state, {
        tx: 0, tz: 0, azimuth: 0,
        duration: 0.85, ease: 'back.out(1.4)',
      })
    }
    this.targetDist = this.mode === 'iso' ? HOME.dist : this.targetDist
  }

  /* ------------------------------ update ------------------------------ */

  update(dt: number) {
    if (this.mode === 'menu') {
      this.menuT += dt
      this.state.azimuth += dt * 0.07
      this.state.ty = 4 + Math.sin(this.menuT * 0.4) * 1.2
    }
    if (this.mode === 'follow' && this.followPos) {
      // kejar target dengan lentur bouncy
      this.state.tx += (this.followPos.x - this.state.tx) * Math.min(1, dt * 3)
      this.state.tz += (this.followPos.z - this.state.tz) * Math.min(1, dt * 3)
      this.bobT += dt
    }

    /* ---- P2: momentum pan (drag dilepas → meluncur) ---- */
    if (this.momentumT > 0 && this.dragBtn < 0) {
      this.momentumT -= dt
      const damp = Math.max(0, this.momentumT / 0.85) // pelan berhenti
      this.panBy(this.velX * damp * dt, this.velZ * damp * dt)
      this.velX *= 1 - Math.min(1, dt * 0.9)
      this.velZ *= 1 - Math.min(1, dt * 0.9)
      if (this.momentumT <= 0) this.stopMomentum()
    }

    /* ---- P2: zoom damping halus ---- */
    if (this.dragBtn < 0 && !this.tween?.isActive()) {
      this.state.dist = THREE.MathUtils.lerp(this.state.dist, this.targetDist, Math.min(1, dt * 7))
    } else {
      this.targetDist = this.state.dist
    }

    this.applyState(dt)
  }

  private applyState(dt: number) {
    const s = this.state
    const horiz = Math.cos(s.elevation) * s.dist
    const vert = Math.sin(s.elevation) * s.dist
    this.tmp.set(
      s.tx + Math.sin(s.azimuth) * horiz,
      s.ty + vert,
      s.tz + Math.cos(s.azimuth) * horiz,
    )

    // smoothing lentur
    const k = this.mode === 'photo' || this.dragBtn >= 0 ? 1 : Math.min(1, dt * 6)
    this.camera.position.lerp(this.tmp, k)
    this.smoothTarget.lerp(this.tmp.set(s.tx, s.ty, s.tz), Math.min(1, dt * 6))

    if (this.mode === 'follow') {
      this.camera.position.y += Math.sin(this.bobT * 2.4) * 0.08
    }

    this.camera.lookAt(this.smoothTarget)
  }
}
