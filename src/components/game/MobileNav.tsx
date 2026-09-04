'use client'

/* P2: Navigasi kamera khusus mobile — D-pad semi transparan,
   tombol zoom +/-, dan Recenter (kembali ke tengah papan).
   Auto-hide saat tidak disentuh (opacity rendah), jelas saat
   disentuh/hover. Desktop juga bisa memakai (berguna saat
   drag kurang nyaman). */

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair, ZoomIn, ZoomOut } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'

const PAN_STEP = 10 // unit dunia per tekan
const PAN_STEP_SMALL = 4
const ZOOM_STEP = 6

export function MobileNav() {
  const screen = useGameStore((s) => s.screen)
  const paused = useGameStore((s) => s.paused)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const hudHidden = useGameStore((s) => s.hudHidden)
  const [active, setActive] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // hanya tampil saat playing & bukan mode foto (foto punya kontrol sendiri)
  if (screen !== 'playing' || paused || cameraMode === 'photo' || cameraMode === 'boss') return null

  const wake = () => {
    setActive(true)
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => setActive(false), 2600)
  }

  const pan = (dx: number, dz: number) => {
    wake()
    getEngine()?.panCamera(dx, dz)
  }

  const startHold = (dx: number, dz: number, step: number) => {
    getEngine()?.panCamera(dx * step, dz * step)
    if (holdTimer.current) clearInterval(holdTimer.current)
    let ticks = 0
    holdTimer.current = setInterval(() => {
      ticks++
      // makin lama ditahan makin cepat
      const mult = 1 + Math.min(3, ticks * 0.15)
      getEngine()?.panCamera(dx * step * mult, dz * step * mult)
    }, 90)
  }
  const stopHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current)
    holdTimer.current = null
  }

  const zoom = (delta: number) => {
    wake()
    getEngine()?.zoomCamera(delta)
  }

  return (
    <div
      className="pointer-events-none fixed bottom-36 right-3 z-30 flex flex-col items-end gap-2 sm:bottom-28"
      onPointerEnter={wake}
      onPointerDown={wake}
    >
      {/* Label kecil */}
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="pointer-events-none rounded-full border-2 border-amber-200 bg-[#fff8e7]/90 px-2.5 py-0.5 text-[10px] font-black text-[#7a4a10] shadow-md"
          >
            🕹️ Geser kamera
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tombol zoom + recenter */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button
          className="nav-cam-btn"
          aria-label="Perbesar (zoom in)"
          onClick={() => zoom(-ZOOM_STEP)}
        >
          <ZoomIn className="h-4.5 w-4.5" />
        </button>
        <button
          className="nav-cam-btn"
          aria-label="Perkecil (zoom out)"
          onClick={() => zoom(ZOOM_STEP)}
        >
          <ZoomOut className="h-4.5 w-4.5" />
        </button>
        <button
          className="nav-cam-btn nav-cam-recenter"
          aria-label="Kembali ke tengah papan"
          onClick={() => {
            wake()
            getEngine()?.recenterCamera()
          }}
        >
          <Crosshair className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* D-pad */}
      <div
        className={`nav-dpad pointer-events-auto ${active ? 'nav-dpad-active' : ''}`}
        role="group"
        aria-label="Navigasi kamera"
      >
        <button
          className="nav-dpad-cell nav-dpad-up"
          aria-label="Geser kamera ke atas"
          onPointerDown={() => startHold(0, -1, PAN_STEP_SMALL)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          className="nav-dpad-cell nav-dpad-left"
          aria-label="Geser kamera ke kiri"
          onPointerDown={() => startHold(-1, 0, PAN_STEP_SMALL)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          className="nav-dpad-cell nav-dpad-center"
          aria-label="Kembali ke tengah"
          onClick={() => {
            wake()
            getEngine()?.recenterCamera()
          }}
        >
          <Crosshair className="h-4 w-4" />
        </button>
        <button
          className="nav-dpad-cell nav-dpad-right"
          aria-label="Geser kamera ke kanan"
          onPointerDown={() => startHold(1, 0, PAN_STEP_SMALL)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          className="nav-dpad-cell nav-dpad-down"
          aria-label="Geser kamera ke bawah"
          onPointerDown={() => startHold(0, 1, PAN_STEP_SMALL)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
