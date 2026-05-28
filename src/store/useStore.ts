import { create } from 'zustand'

export type Screen = 'menu' | 'audio-setup' | 'game' | 'settings' | 'tuner' | 'mode-select' | 'countdown' | 'game-play' | 'report'

interface GameState {
  screen: Screen
  setScreen: (screen: Screen) => void
}

export const useStore = create<GameState>((set) => ({
  screen: 'menu',
  setScreen: (screen) => set({ screen }),
}))
