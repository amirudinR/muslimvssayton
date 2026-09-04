/* ============================================================
 * PENJAGA MASJID — CameraController
 * Mode: menu (auto-orbit), iso (top-down pan/zoom ramah anak),
 * follow (ikuti karakter, bouncy), photo (orbit bebas + screenshot),
 * boss (intro sinematik lucu). Transisi via GSAP ease bouncy.
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

const BOUNDS = { x: 36, z: 24 }

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

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 300)
    this.applyState(1)
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
      // pan di bidang tanah (kecepatan skala dist)
      const panSpeed = this.state.dist * 0.0016
      const cos = Math.cos(this.state.azimuth)
      const sin = Math.sin(this.state.azimuth)
      // geser tegak lurus arah pandang
      const mx = -dx * panSpeed
      const mz = dy * panSpeed
      this.state.tx += mx * cos - mz * sin
      this.state.tz += mx * sin + mz * cos
      this.state.tx = THREE.MathUtils.clamp(this.state.tx, -BOUNDS.x, BOUNDS.x)
      this.state.tz = THREE.MathUtils.clamp(this.state.tz, -BOUNDS.z, BOUNDS.z)
      return true
    }
    return false
  }

  onPointerUp() {
    this.dragBtn = -1
  }

  onWheel(delta: number): boolean {
    if (this.mode === 'boss') return false
    const min = this.mode === 'photo' ? 10 : this.mode === 'follow' ? 8 : 18
    const max = this.mode === 'photo' ? 70 : this.mode === 'follow' ? 20 : 55
    this.state.dist = THREE.MathUtils.clamp(this.state.dist + delta * 0.02, min, max)
    return true
  }

  rotateBy(delta: number) {
    this.tween?.kill()
    gsap.to(this.state, {
      azimuth: this.state.azimuth + delta,
      duration: 0.7,
      ease: 'back.out(1.8)',
    })
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
