import { useCallback, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useAudioConfig } from '@/hooks/useAudioConfig'
import MainMenu from '@/components/MainMenu'
import AudioSetup from '@/components/AudioSetup'
import Settings from '@/components/Settings'
import Tuner from '@/components/Tuner'
import ModeSelect from '@/components/ModeSelect'
import Countdown from '@/components/Countdown'
import GameScreen from '@/components/GameScreen'
import ReportScreen from '@/components/ReportScreen'

function App() {
  const screen = useStore((s) => s.screen)
  const setScreen = useStore((s) => s.setScreen)
  const { validateDevice } = useAudioConfig()
  const [checking, setChecking] = useState(false)

  const handleStartGame = useCallback(async () => {
    setChecking(true)
    try {
      const raw = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = raw.filter((d) => d.kind === 'audioinput')
      const { valid } = validateDevice(audioInputs)
      setScreen(valid ? 'tuner' : 'audio-setup')
    } catch {
      setScreen('audio-setup')
    } finally {
      setChecking(false)
    }
  }, [setScreen, validateDevice])

  if (checking) {
    return (
      <div className="bg-grid-glow flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted-foreground">Checking audio...</p>
      </div>
    )
  }

  switch (screen) {
    case 'audio-setup':
      return <AudioSetup />
    case 'settings':
      return <Settings />
    case 'tuner':
      return <Tuner />
    case 'mode-select':
      return <ModeSelect />
    case 'countdown':
      return <Countdown />
    case 'game-play':
      return <GameScreen />
    case 'report':
      return <ReportScreen />
    default:
      return <MainMenu onStartGame={handleStartGame} />
  }
}

export default App
