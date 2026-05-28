import { useCallback } from 'react'

const STORAGE_KEY = 'fretboard-guitar-config'

export type StringsCount = 6 | 7 | 8
export type FretsCount = 21 | 22 | 24

export interface GuitarConfig {
  strings: StringsCount
  frets: FretsCount
}

const DEFAULT_CONFIG: GuitarConfig = { strings: 6, frets: 22 }

export function useGuitarConfig() {
  const loadConfig = useCallback((): GuitarConfig => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    } catch {
      return { ...DEFAULT_CONFIG }
    }
  }, [])

  const saveConfig = useCallback((config: GuitarConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [])

  return { loadConfig, saveConfig, defaultConfig: DEFAULT_CONFIG }
}
