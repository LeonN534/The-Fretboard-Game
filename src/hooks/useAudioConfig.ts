import { useCallback } from 'react'

const STORAGE_KEY = 'fretboard-audio-config'

interface AudioConfig {
  deviceId: string
  deviceLabel: string
  savedAt: number
  inputGain?: number
}

function readAudioConfig(): AudioConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AudioConfig
    return { ...parsed, inputGain: parsed.inputGain ?? 1.0 }
  } catch {
    return null
  }
}

export function useAudioConfig() {
  const loadConfig = useCallback((): AudioConfig | null => {
    return readAudioConfig()
  }, [])

  const saveConfig = useCallback((deviceId: string, deviceLabel: string, inputGain?: number) => {
    const current = readAudioConfig()
    const config: AudioConfig = {
      deviceId,
      deviceLabel,
      savedAt: Date.now(),
      inputGain: inputGain ?? current?.inputGain ?? 1.0,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [])

  const saveInputGain = useCallback((gain: number) => {
    const current = readAudioConfig()
    if (current) {
      current.inputGain = Math.max(0.25, Math.min(4, gain))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
  }, [])

  const validateDevice = useCallback(
    (devices: MediaDeviceInfo[]): { valid: boolean; config: AudioConfig | null } => {
      const config = readAudioConfig()
      if (!config) return { valid: false, config: null }
      const stillExists = devices.some((d) => d.deviceId === config.deviceId)
      return { valid: stillExists, config: stillExists ? config : null }
    },
    [],
  )

  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { saveConfig, saveInputGain, loadConfig, validateDevice, clearConfig }
}
