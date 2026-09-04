'use client'

/* GameShell: memasang canvas Three.js, membuat engine, dan
   merangkai seluruh overlay UI. */

import { useEffect, useRef } from 'react'
import { GameEngine, setEngineInstance } from '@/lib/game/engine'
import { useGameStore } from '@/lib/game/store'
import { closeCollection } from '@/lib/game/collection'
import { MainMenu } from './MainMenu'
import { Hud, ToastLayer, FunFactModal } from './Hud'
import { CharacterBar } from './CharacterBar'
import { TowerPanel } from './TowerPanel'
import { EndScreens, PhotoControls } from './EndScreens'
import { DuaButton, BadgeToastLayer } from './DuaButton'
import { TutorialLayer } from './TutorialLayer'
import { MobileNav } from './MobileNav'
import { ShopScreen } from './ShopScreen'
import { LevelSelectScreen } from './LevelSelectScreen'
import { SettingsScreen } from './SettingsScreen'
import { CollectionScreen } from './CollectionScreen'

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine()
    engine.init(canvas)
    setEngineInstance(engine)
    engine.resize()

    const parent = canvas.parentElement
    const ro = parent ? new ResizeObserver(() => engine.resize()) : null
    if (parent && ro) ro.observe(parent)

    // latar belakang mulai dari menu (kamera orbit masjid)
    engine.setCameraMode('menu')

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const st = useGameStore.getState()
        if (st.collectionOpen) {
          closeCollection()
          return
        }
        if (st.selectedCharId) engine.cancelPlacing()
        else if (st.selectedTower) engine.deselectTower()
        else if (st.cameraMode === 'photo') engine.setCameraMode('iso')
      }
      if (e.key === ' ' && stCanToggle()) {
        const st = useGameStore.getState()
        if (st.collectionOpen) return // jangan toggle jeda saat koleksi terbuka
        e.preventDefault()
        if (st.screen === 'playing') st.setPaused(!st.paused)
      }
    }
    const stCanToggle = () => true
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      ro?.disconnect()
      engine.dispose()
      setEngineInstance(null)
    }
  }, [])

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#8fd4ff]">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{ display: 'block' }}
        aria-label="Arena game Penjaga Masjid 3D"
      />

      {/* Cahaya lembut di tepi layar agar makin hangat */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(255,244,214,0.35)]" />

      <MainMenu />
      <Hud />
      <TowerPanel />
      <CharacterBar />
      <MobileNav />
      <ShopScreen />
      <LevelSelectScreen />
      <SettingsScreen />
      <CollectionScreen />
      <EndScreens />
      <PhotoControls />
      <DuaButton />
      <TutorialLayer />
      <ToastLayer />
      <FunFactModal />
      <BadgeToastLayer />
    </div>
  )
}
