'use client'

/* Preview 3D mini karakter yang bisa berputar (dipakai panel pilih karakter). */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getCharacterModel } from '@/lib/game/models'
import type { CharId } from '@/lib/game/data'

export function CharPreview({ charId, size = 130 }: { charId: CharId; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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

    const model = getCharacterModel(charId, 1)
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
  }, [charId, size])

  return <canvas ref={ref} style={{ width: size, height: size }} aria-label={`Preview karakter ${charId}`} />
}
