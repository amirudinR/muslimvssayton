/* ============================================================
 * PENJAGA MASJID — Zustand Store (state UI)
 * Engine menulis state ke sini; React membaca & merender UI.
 * ============================================================ */

import { create } from 'zustand'
import { GAME_CONST, type CharId } from './data'

export type Screen = 'menu' | 'playing' | 'victory' | 'gameover'
export type CameraMode = 'iso' | 'follow' | 'photo' | 'menu' | 'boss'
export type Quality = 'low' | 'medium' | 'high'

export interface ToastMsg {
  id: number
  text: string
  emoji?: string
  tone?: 'good' | 'bad' | 'info'
}

export interface SelectedTowerInfo {
  slot: number
  char: CharId
  level: number // 1..3
  canUpgrade: boolean
  upgradeCost: number
  canSell: boolean
  sellValue: number
}

export interface GameStore {
  screen: Screen
  paused: boolean
  pahala: number
  mosqueHp: number
  wave: number // 0 = belum mulai
  waveActive: boolean
  nextWaveIn: number
  speed: 1 | 2
  quality: Quality
  cameraMode: CameraMode
  soundOn: boolean
  musicOn: boolean
  selectedCharId: CharId | null // kartu yang dipilih untuk ditempatkan
  dragging: boolean // sedang drag dari kartu
  selectedTower: SelectedTowerInfo | null
  wavePreview: { emoji: string; count: number }[]
  bossHp: number | null
  bossMaxHp: number
  toast: ToastMsg | null
  funFact: { id: number; char: CharId; text: string } | null
  unlockedChars: CharId[]
  stats: { defeated: number; starsEarned: number; wavesCleared: number }
  hudHidden: boolean // mode foto
}

interface GameActions {
  setScreen: (s: Screen) => void
  setPaused: (p: boolean) => void
  setPahala: (v: number) => void
  addPahala: (v: number) => void
  setMosqueHp: (v: number) => void
  setWave: (w: number) => void
  setWaveActive: (a: boolean) => void
  setNextWaveIn: (t: number) => void
  setSpeed: (s: 1 | 2) => void
  setQuality: (q: Quality) => void
  setCameraMode: (m: CameraMode) => void
  setSoundOn: (v: boolean) => void
  setMusicOn: (v: boolean) => void
  setSelectedChar: (c: CharId | null) => void
  setDragging: (d: boolean) => void
  setSelectedTower: (t: SelectedTowerInfo | null) => void
  setWavePreview: (p: { emoji: string; count: number }[]) => void
  setBossHp: (hp: number | null, max?: number) => void
  showToast: (text: string, emoji?: string, tone?: ToastMsg['tone']) => void
  clearToast: () => void
  showFunFact: (char: CharId, text: string) => void
  clearFunFact: () => void
  unlockChar: (c: CharId) => void
  setHudHidden: (h: boolean) => void
  bumpStats: (patch: Partial<GameStore['stats']>) => void
  resetForNewGame: () => void
}

let toastId = 0

export const useGameStore = create<GameStore & GameActions>()((set) => ({
  screen: 'menu',
  paused: false,
  pahala: 0,
  mosqueHp: GAME_CONST.mosqueMaxHp,
  wave: 0,
  waveActive: false,
  nextWaveIn: 0,
  speed: 1,
  quality: 'high',
  cameraMode: 'menu',
  soundOn: true,
  musicOn: true,
  selectedCharId: null,
  dragging: false,
  selectedTower: null,
  wavePreview: [],
  bossHp: null,
  bossMaxHp: 650,
  toast: null,
  funFact: null,
  unlockedChars: ['ali', 'aisyah'],
  stats: { defeated: 0, starsEarned: 0, wavesCleared: 0 },
  hudHidden: false,

  setScreen: (s) => set({ screen: s }),
  setPaused: (p) => set({ paused: p }),
  setPahala: (v) => set({ pahala: Math.max(0, Math.round(v)) }),
  addPahala: (v) => set((st) => ({ pahala: Math.max(0, Math.round(st.pahala + v)) })),
  setMosqueHp: (v) => set({ mosqueHp: Math.max(0, Math.round(v)) }),
  setWave: (w) => set({ wave: w }),
  setWaveActive: (a) => set({ waveActive: a }),
  setNextWaveIn: (t) => set({ nextWaveIn: Math.max(0, t) }),
  setSpeed: (s) => set({ speed: s }),
  setQuality: (q) => set({ quality: q }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setSoundOn: (v) => set({ soundOn: v }),
  setMusicOn: (v) => set({ musicOn: v }),
  setSelectedChar: (c) => set({ selectedCharId: c }),
  setDragging: (d) => set({ dragging: d }),
  setSelectedTower: (t) => set({ selectedTower: t }),
  setWavePreview: (p) => set({ wavePreview: p }),
  setBossHp: (hp, max) => set((st) => ({ bossHp: hp, bossMaxHp: max ?? st.bossMaxHp })),

  showToast: (text, emoji, tone = 'info') => {
    toastId += 1
    set({ toast: { id: toastId, text, emoji, tone } })
  },
  clearToast: () => set({ toast: null }),

  showFunFact: (char, text) => {
    toastId += 1
    set({ funFact: { id: toastId, char, text } })
  },
  clearFunFact: () => set({ funFact: null }),

  unlockChar: (c) =>
    set((st) => (st.unlockedChars.includes(c) ? st : { unlockedChars: [...st.unlockedChars, c] })),

  setHudHidden: (h) => set({ hudHidden: h }),
  bumpStats: (patch) => set((st) => ({ stats: { ...st.stats, ...patch } })),

  resetForNewGame: () =>
    set({
      screen: 'playing',
      paused: false,
      pahala: 0,
      mosqueHp: GAME_CONST.mosqueMaxHp,
      wave: 0,
      waveActive: false,
      nextWaveIn: 0,
      selectedCharId: null,
      dragging: false,
      selectedTower: null,
      wavePreview: [],
      bossHp: null,
      toast: null,
      funFact: null,
      unlockedChars: ['ali', 'aisyah'],
      stats: { defeated: 0, starsEarned: 0, wavesCleared: 0 },
      hudHidden: false,
      cameraMode: 'iso',
    }),
}))

/* Helper non-React untuk dipakai engine */
export const gameStore = {
  get: () => useGameStore.getState(),
  set: (fn: (st: GameStore & GameActions) => Partial<GameStore & GameActions>) =>
    useGameStore.setState(fn),
}
