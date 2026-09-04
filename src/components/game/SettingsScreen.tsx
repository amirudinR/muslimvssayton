'use client'

/* P3: SETTINGS — volume musik/SFX terpisah (slider), kualitas grafis,
   sensitivitas kamera (drag & zoom), tombol reset progres. */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings as SettingsIcon, Volume2, Music, Gauge, Monitor, Trash2, HeartHandshake } from 'lucide-react'
import { useGameStore } from '@/lib/game/store'
import { getEngine } from '@/lib/game/engine'
import { audio } from '@/lib/game/audio'
import type { Quality } from '@/lib/game/data'
import { LANGUAGES, useLanguage } from '@/lib/game/i18n'

const QUALITY_OPTS: { id: Quality; label: string; hint: string }[] = [
  { id: 'low', label: 'Ringan', hint: 'HP / tablet lama' },
  { id: 'medium', label: 'Sedang', hint: 'Laptop' },
  { id: 'high', label: 'Jempolan', hint: 'Keren full!' },
]

export function SettingsScreen() {
  const screen = useGameStore((s) => s.screen)
  const quality = useGameStore((s) => s.quality)
  const soundOn = useGameStore((s) => s.soundOn)
  const musicOn = useGameStore((s) => s.musicOn)
  const { language, setLanguage, t } = useLanguage()
  const [sfxVol, setSfxVol] = useState(() => Math.round(audio.sfxVolume * 100))
  const [musicVol, setMusicVol] = useState(() => Math.round(audio.musicVolume * 100))
  const [dragSens, setDragSens] = useState(() => {
    if (typeof window === 'undefined') return 100
    const v = Number(window.localStorage.getItem('pm-drag-sens') || '100')
    return Number.isFinite(v) ? Math.max(30, Math.min(220, v)) : 100
  })
  const [zoomSens, setZoomSens] = useState(() => {
    if (typeof window === 'undefined') return 100
    const v = Number(window.localStorage.getItem('pm-zoom-sens') || '100')
    return Number.isFinite(v) ? Math.max(30, Math.min(220, v)) : 100
  })
  const [confirmReset, setConfirmReset] = useState(false)

  if (screen !== 'settings') return null

  const close = () => {
    audio.chime()
    useGameStore.getState().setScreen('menu')
  }

  const applySfx = (v: number) => {
    setSfxVol(v)
    audio.setSfxVolume(v / 100)
  }
  const applyMusic = (v: number) => {
    setMusicVol(v)
    audio.setMusicVolume(v / 100)
  }
  const applyDragSens = (v: number) => {
    setDragSens(v)
    window.localStorage.setItem('pm-drag-sens', String(v))
  }
  const applyZoomSens = (v: number) => {
    setZoomSens(v)
    window.localStorage.setItem('pm-zoom-sens', String(v))
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#f0f4ff] via-[#f8f0e8] to-[#fff3d6]">
      {/* header */}
      <div className="flex shrink-0 items-center gap-2 border-b-4 border-sky-300 bg-gradient-to-r from-[#f0f8ff] to-[#fffbe8] px-3 py-2 shadow-md sm:px-5 sm:py-3">
        <button className="btn-round" aria-label="Tutup pengaturan" onClick={close}>
          <X className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <SettingsIcon className="h-6 w-6 shrink-0 text-sky-600 sm:h-7 sm:w-7" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-wide text-[#4a3b20] sm:text-xl">{t('settings')}</h2>
            <p className="-mt-1 hidden text-[10px] font-bold text-[#8a6a30] sm:block">{t('settingsHint')}</p>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">

          {/* --- Audio --- */}
          <section className="settings-card">
            <p className="settings-title"><Volume2 className="h-4 w-4" /> {t('sound')}</p>
            <div className="flex items-center gap-3">
              <button
                className="btn-icon !h-8 !w-8"
                aria-label="Nyalakan/matikan SFX"
                onClick={() => {
                  const st = useGameStore.getState()
                  st.setSoundOn(!st.soundOn)
                  audio.setSound(!st.soundOn)
                  if (!st.soundOn) audio.chime()
                }}
              >
                {soundOn ? <Volume2 className="h-4 w-4" /> : <span className="text-xs font-black">✕</span>}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={sfxVol}
                onChange={(e) => applySfx(Number(e.target.value))}
                className="cute-range flex-1"
                aria-label="Volume efek suara"
              />
              <span className="w-10 text-right text-sm font-black text-[#4a3b20]">{sfxVol}%</span>
            </div>
            <p className="settings-title mt-3"><Music className="h-4 w-4" /> {t('music')}</p>
            <div className="flex items-center gap-3">
              <button
                className="btn-icon !h-8 !w-8"
                aria-label="Nyalakan/matikan musik"
                onClick={() => {
                  const st = useGameStore.getState()
                  st.setMusicOn(!st.musicOn)
                  audio.setMusic(!st.musicOn)
                  if (!st.musicOn) audio.startBgm()
                }}
              >
                {musicOn ? <Music className="h-4 w-4" /> : <span className="text-xs font-black">✕</span>}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={musicVol}
                onChange={(e) => applyMusic(Number(e.target.value))}
                className="cute-range flex-1"
                aria-label="Volume musik"
              />
              <span className="w-10 text-right text-sm font-black text-[#4a3b20]">{musicVol}%</span>
            </div>
          </section>

          {/* --- Kualitas grafis --- */}
          <section className="settings-card">
            <p className="settings-title"><Monitor className="h-4 w-4" /> {t('quality')}</p>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTS.map((q) => (
                <button
                  key={q.id}
                  className={`quality-opt ${quality === q.id ? 'quality-opt-active' : ''}`}
                  onClick={() => getEngine()?.applyQuality(q.id)}
                  title={q.hint}
                >
                  <span className="text-sm font-black">{q.label}</span>
                  <span className="text-[9px] font-bold opacity-70">{q.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* --- Sensitivitas kamera --- */}
          <section className="settings-card">
            <p className="settings-title"><Gauge className="h-4 w-4" /> {t('camera')}</p>
            <p className="mb-1 text-[11px] font-bold text-[#8a6a30]">{t('drag')}</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#8a6a30]">{t('slow')}</span>
              <input
                type="range"
                min={30}
                max={220}
                value={dragSens}
                onChange={(e) => applyDragSens(Number(e.target.value))}
                className="cute-range flex-1"
                aria-label="Sensitivitas drag kamera"
              />
              <span className="text-[10px] font-black text-[#8a6a30]">{t('fast')}</span>
              <span className="w-10 text-right text-sm font-black text-[#4a3b20]">{dragSens}%</span>
            </div>
            <p className="mb-1 mt-3 text-[11px] font-bold text-[#8a6a30]">{t('zoom')}</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#8a6a30]">{t('smooth')}</span>
              <input
                type="range"
                min={30}
                max={220}
                value={zoomSens}
                onChange={(e) => applyZoomSens(Number(e.target.value))}
                className="cute-range flex-1"
                aria-label="Sensitivitas zoom kamera"
              />
              <span className="text-[10px] font-black text-[#8a6a30]">{t('bold')}</span>
              <span className="w-10 text-right text-sm font-black text-[#4a3b20]">{zoomSens}%</span>
            </div>
          </section>

          <section className="settings-card">
            <p className="settings-title"><span aria-hidden>文</span> {t('language')}</p>
            <label className="sr-only" htmlFor="game-language">{t('languageHint')}</label>
            <select
              id="game-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="w-full rounded-xl border-2 border-emerald-200 bg-white px-3 py-2 text-sm font-black text-[#4a3b20] outline-none focus:border-emerald-400"
            >
              {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </section>

          {/* --- Reset progres --- */}
          <section className="settings-card !border-rose-200">
            <p className="settings-title text-rose-600"><Trash2 className="h-4 w-4" /> {t('resetTitle')}</p>
            <p className="mb-2 text-[11px] font-semibold text-[#8a6a30]">{t('resetDesc')}</p>
            <AnimatePresence mode="wait">
              {confirmReset ? (
                <motion.div key="confirm" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
                  <button
                    className="btn-cute-danger flex-1 !py-2 !text-xs"
                    onClick={() => {
                      window.localStorage.removeItem('penjaga-masjid-save-v1')
                      window.localStorage.removeItem('penjaga-masjid-custom-char')
                      audio.mosqueHit()
                      setConfirmReset(false)
                      useGameStore.getState().showToast('Progres dihapus. Selamat memulai petualangan baru! 🌱', '🌱', 'info')
                    }}
                  >
                    {t('yesReset')}
                  </button>
                  <button className="btn-cute-secondary flex-1 !py-2 !text-xs" onClick={() => setConfirmReset(false)}>
                    {t('cancel')}
                  </button>
                </motion.div>
              ) : (
                <motion.button key="ask" whileTap={{ scale: 0.96 }} className="btn-cute-danger w-full !py-2 !text-xs" onClick={() => setConfirmReset(true)}>
                  <Trash2 className="h-4 w-4" />
                  {t('resetButton')}
                </motion.button>
              )}
            </AnimatePresence>
          </section>

          {/* --- footer manis --- */}
          <div className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 px-4 py-3 text-center">
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            <p className="text-[11px] font-bold text-[#3d5a3a]">
              Dibuat dengan cinta untuk anak-anak sholeh Indonesia 🇮🇩
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
