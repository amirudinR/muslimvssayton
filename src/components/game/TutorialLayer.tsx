'use client'

/* TutorialLayer: panduan interaktif pertama main — gelembung nasihat
   Kakek Imam + cincin sorot pulsing pada tombol target (data-tut). */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'

interface TutStep {
  title: string
  text: string
  /** data-tut target yang disorot (null = info saja) */
  target: string | null
  /** posisi gelembung */
  position: 'top' | 'bottom'
}

export const TUT_STEPS: TutStep[] = [
  {
    title: "Assalamu'alaikum! 👋",
    text: 'Aku Kakek Imam! Yuk kita jaga masjid bersama. Ketuk kartu ALI di bawah ini ya!',
    target: 'cards',
    position: 'bottom',
  },
  {
    title: 'Pilihan Bagus! 🧒',
    text: 'Sekarang ketuk lingkaran HIJAU di halaman masjid — Ali akan berjaga di sana!',
    target: null,
    position: 'bottom',
  },
  {
    title: 'Alhamdulillah, Terpasang! ✨',
    text: 'Ali sudah berjaga! Sekarang tekan tombol MULAI GELOMBANG — setan lucu mau datang!',
    target: 'wave-btn',
    position: 'top',
  },
  {
    title: 'Setan Datang! 👻',
    text: 'Ali otomatis melempar cahaya sajadah. Setiap setan yang dihalau memberi pahala ⭐ — kumpulkan untuk penjaga baru!',
    target: null,
    position: 'top',
  },
  {
    title: 'Kekuatan Doa! 🤲',
    text: 'Tombol DOA di kiri terisi energi tiap setan dihalau. Saat penuh & berkilau, tekan untuk berkah luar biasa!',
    target: 'dua-btn',
    position: 'top',
  },
  {
    title: 'Kamu Siap! 🏆',
    text: 'Pasang penjaga lain, upgrade ke ⭐⭐⭐, dan lindungi masjid sampai gelombang 10. Semangat, Penjaga Masjid!',
    target: null,
    position: 'top',
  },
]

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/* ukur posisi elemen target secara dinamis (layout bisa bergeser) */
function useTargetRect(target: string | null, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      if (!active || !target) {
        setRect(null)
        return
      }
      const el = document.querySelector<HTMLElement>(`[data-tut="${target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect((prev) =>
          prev && prev.x === r.left && prev.y === r.top && prev.w === r.width && prev.h === r.height
            ? prev
            : { x: r.left, y: r.top, w: r.width, h: r.height },
        )
      } else {
        setRect(null)
      }
      timer = window.setTimeout(tick, 700) as unknown as number
    }
    // mulai asinkron agar setState tidak dipanggil sinkron di body effect
    timer = window.setTimeout(tick, 0) as unknown as number
    return () => clearTimeout(timer)
  }, [active, target])
  return rect
}

export function TutorialLayer() {
  const tutorialStep = useGameStore((s) => s.tutorialStep)
  const screen = useGameStore((s) => s.screen)

  const active = tutorialStep >= 1 && tutorialStep <= TUT_STEPS.length && screen === 'playing'
  const step = active ? TUT_STEPS[tutorialStep - 1] : null
  const rect = useTargetRect(step?.target ?? null, active)

  return (
    <>
      {/* ---- cincin sorot target ---- */}
      {active && rect && (
        <div
          className="tut-ring"
          style={{ left: rect.x - 8, top: rect.y - 8, width: rect.w + 16, height: rect.h + 16 }}
          aria-hidden
        />
      )}

      {/* ---- gelembung nasihat Kakek Imam ---- */}
      <AnimatePresence>
        {active && step && (
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, y: step.position === 'top' ? -28 : 28, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 20 }}
            className={`pointer-events-none fixed left-1/2 z-40 w-[min(94vw,30rem)] -translate-x-1/2 ${
              step.position === 'top' ? 'top-24 sm:top-28' : 'bottom-44 sm:bottom-40'
            }`}
            role="dialog"
            aria-label={`Tutorial langkah ${tutorialStep}`}
          >
            <div className="tut-bubble relative">
              {/* maskot Kakek Imam */}
              <div className="tut-mascot" aria-hidden>
                👴
                <span className="tut-mascot-badge">🕌</span>
              </div>

              <div className="flex items-start gap-2 pl-14">
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-800 sm:text-base">{step.title}</p>
                  <p className="mt-0.5 text-xs font-bold leading-relaxed text-[#5a4520] sm:text-sm">{step.text}</p>
                  {/* titik langkah */}
                  <div className="mt-1.5 flex items-center gap-1.5" aria-label={`Langkah ${tutorialStep} dari 6`}>
                    {TUT_STEPS.map((_, i) => (
                      <span key={i} className={`tut-dot ${i + 1 === tutorialStep ? 'tut-dot-on' : ''}`} />
                    ))}
                    <span className="ml-1 text-[10px] font-black text-amber-600">{tutorialStep}/6</span>
                  </div>
                </div>
              </div>

              <button
                className="tut-skip"
                aria-label="Lewati tutorial"
                onClick={() => getEngine()?.skipTutorial()}
              >
                <X className="h-3.5 w-3.5" />
                Lewati
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
