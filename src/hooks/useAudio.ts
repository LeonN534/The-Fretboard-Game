import { useEffect, useRef, useState, useCallback } from 'react'

export interface AudioState {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string | null
  isMonitoring: boolean
  level: number
  isPermissionGranted: boolean
  isStreaming: boolean
  error: string | null
  stream: MediaStream | null
}

interface UseAudioReturn extends AudioState {
  requestPermission: () => Promise<void>
  selectDevice: (deviceId: string) => Promise<void>
  toggleMonitor: () => void
  refreshDevices: () => Promise<void>
  cleanup: () => void
}

export function useAudio(savedDeviceId?: string | null, inputGain?: number): UseAudioReturn {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [level, setLevel] = useState(0)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const inputGainRef = useRef<GainNode | null>(null)
  const rafRef = useRef<number>(0)
  const hasAutoInit = useRef(false)

  const getAudioContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const enumerateDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    return all.filter((d) => d.kind === 'audioinput')
  }, [])

  const refreshDevices = useCallback(async () => {
    const inputs = await enumerateDevices()
    setDevices(inputs)
  }, [enumerateDevices])

  const buildAudioGraph = useCallback(
    async (deviceId: string) => {
      cleanup()

      const ctx = getAudioContext()
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      } catch (err) {
        throw err
      }

      const source = ctx.createMediaStreamSource(stream)
      const inputGainNode = ctx.createGain()
      inputGainNode.gain.value = inputGain ?? 1.0
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024

      const monitorGain = ctx.createGain()
      monitorGain.gain.value = 0.5

      source.connect(inputGainNode)
      inputGainNode.connect(analyser)
      source.connect(monitorGain)
      monitorGain.connect(ctx.destination)

      ctxRef.current = ctx
      streamRef.current = stream
      setStream(stream)
      sourceRef.current = source
      inputGainRef.current = inputGainNode
      gainRef.current = monitorGain
      analyserRef.current = analyser
      setIsStreaming(true)
      setError(null)

      if (!isMonitoring) {
        monitorGain.disconnect(ctx.destination)
      }

      startLevelMeter(analyser)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMonitoring],
  )

  const startLevelMeter = useCallback((analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount
    const timeData = new Uint8Array(bufferLength)

    function tick() {
      analyser.getByteTimeDomainData(timeData)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const val = (timeData[i] - 128) / 128
        sum += val * val
      }
      const rms = Math.sqrt(sum / bufferLength)
      setLevel(Math.min(rms * 2, 1))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (inputGainRef.current) {
      inputGainRef.current.disconnect()
      inputGainRef.current = null
    }
    if (gainRef.current) {
      gainRef.current.disconnect()
      gainRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (ctxRef.current) {
      ctxRef.current.close()
      ctxRef.current = null
    }
    setStream(null)
    setIsStreaming(false)
    setIsMonitoring(false)
    setLevel(0)
  }, [])

  const selectDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId)
      setError(null)
      try {
        await buildAudioGraph(deviceId)
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Microphone access denied.'
            : `Could not open device. ${(err as Error).message}`
        setError(msg)
      }
    },
    [buildAudioGraph],
  )

  const requestPermission = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setIsPermissionGranted(true)
      const inputs = await enumerateDevices()
      setDevices(inputs)
      if (inputs.length > 0) {
        const targetId =
          savedDeviceId && inputs.some((d) => d.deviceId === savedDeviceId)
            ? savedDeviceId
            : inputs[0].deviceId
        await selectDevice(targetId)
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow mic access in your browser settings.'
          : 'Could not access microphone. Check your connections.'
      setError(msg)
    }
  }, [enumerateDevices, savedDeviceId, selectDevice])

  const toggleMonitor = useCallback(() => {
    if (!gainRef.current || !ctxRef.current) return
    if (isMonitoring) {
      gainRef.current.disconnect()
      setIsMonitoring(false)
    } else {
      gainRef.current.connect(ctxRef.current.destination)
      setIsMonitoring(true)
    }
  }, [isMonitoring])

  useEffect(() => {
    const handler = () => refreshDevices()
    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handler)
      cleanup()
    }
  }, [refreshDevices, cleanup])

  useEffect(() => {
    ;(async () => {
      try {
        const permStatus = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        })
        if (permStatus.state === 'granted') {
          setIsPermissionGranted(true)
          const inputs = await enumerateDevices()
          setDevices(inputs)
          if (inputs.length > 0) {
            const targetId =
              savedDeviceId && inputs.some((d) => d.deviceId === savedDeviceId)
                ? savedDeviceId
                : inputs[0].deviceId
            setSelectedDeviceId(targetId)
          }
        } else if (permStatus.state === 'denied') {
          setError(
            'Microphone access is blocked. Please allow mic access in your system settings.',
          )
        }
      } catch (err) {
        // Permissions API unavailable (e.g. Electron)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasAutoInit.current) return
    hasAutoInit.current = true

    if (isPermissionGranted && devices.length > 0 && selectedDeviceId) {
      selectDevice(selectedDeviceId)
    } else if (savedDeviceId) {
      ;(async () => {
        try {
          const inputs = await enumerateDevices()
          setDevices(inputs)
          const targetId = inputs.some((d) => d.deviceId === savedDeviceId)
            ? savedDeviceId
            : inputs[0]?.deviceId
          if (targetId) {
            setSelectedDeviceId(targetId)
            await selectDevice(targetId)
          }
        } catch (err) {
          // Fallback init failed
        }
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (inputGainRef.current) {
      inputGainRef.current.gain.value = inputGain ?? 1.0
    }
  }, [inputGain])

  return {
    devices,
    selectedDeviceId,
    isMonitoring,
    level,
    isPermissionGranted,
    isStreaming,
    error,
    stream,
    requestPermission,
    selectDevice,
    toggleMonitor,
    refreshDevices,
    cleanup,
  }
}
