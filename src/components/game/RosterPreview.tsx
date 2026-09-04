'use client'

/* Preview 3D mini untuk karakter roster generatif & karakter custom
   (dipakai di Toko & Character Creator). Bisa berputar otomatis. */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getRosterModel, getCustomModel } from '@/lib/game/models'
import { getCharacterModel } from '@/lib/game/models'
import type { RosterChar, CharCustom } from '@/lib/game/roster'

function useSpinPreview(
  ref: React.RefObject<HTMLCanvasElement | null>,
  buildModel: () => THREE.Group,
  deps: unknown[],
  size: number,
) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    } catch {
      return // WebGL tidak tersedia — preview disembunyikan
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(size, size, false)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    camera.position.set(0, 2.3, 4.4)
    camera.lookAt(0, 1.25, 0)

    const hemi = new THREE.HemisphereLight(0xfff8e8, 0xa8d89a, 1.15)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff2d8, 2.2)
    key.position.set(2.5, 4.5, 3.5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.8)
    fill.position.set(-3, 2, 2)
    scene.add(fill)

    let model: THREE.Group
    try {
      model = buildModel()
    } catch {
      renderer.dispose()
      return
    }
    model.rotation.y = -0.4
    scene.add(model)

    let raf = 0
    let spin = -0.4
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = (now - last) / 1000
      last = now
      spin += dt * 0.9
      model.rotation.y = spin
      model.position.y = Math.sin(now * 0.0022) * 0.06
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      renderer.dispose()
    }
  }, deps)
}

export function RosterPreview({ rc, size = 96 }: { rc: RosterChar; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useSpinPreview(
    ref,
    () => (rc.heroId ? getCharacterModel(rc.heroId as 'ali', 1) : getRosterModel(rc, 1)),
    [rc.id],
    size,
  )
  return <canvas ref={ref} style={{ width: size, height: size }} aria-label={`Preview ${rc.name}`} />
}

export function CustomPreview({ cc, size = 184 }: { cc: CharCustom; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useSpinPreview(ref, () => getCustomModel(cc, 1), [cc], size)
  return <canvas ref={ref} style={{ width: size, height: size }} aria-label="Preview karakter custom" />
}
