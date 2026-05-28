import { useEffect, useRef, useState, useCallback } from 'react'
import { detectPitch } from '@/lib/pitchDetection'

export interface PitchState {
  freq: number | null
  note: string | null
  octave: number | null
  cents: number | null
  confidence: number | null
  rms: number | null
}

export function usePitchDetection(
  stream: MediaStream | null,
  inputGain?: number,
): PitchState {
  const [state, setState] = useState<PitchState>({
    freq: null,
    note: null,
    octave: null,
    cents: null,
    confidence: null,
    rms: null,
  })

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const rafRef = useRef<number>(0)

  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const bufferLength = analyser.fftSize
    const timeData = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(timeData)

    const rms = Math.sqrt(
      timeData.reduce((sum, v) => sum + v * v, 0) / bufferLength,
    )

    const result = detectPitch(timeData, analyser.context.sampleRate)

    if (result && result.confidence > 0.1) {
      const midi = 12 * Math.log2(result.freq / 440) + 69
      const midiRounded = Math.round(midi)
      const cents = Math.round((midi - midiRounded) * 100)
      const octave = Math.floor(midiRounded / 12) - 1
      const nameIdx = ((midiRounded % 12) + 12) % 12
      const note = CHROMATIC[nameIdx]

      setState({
        freq: result.freq,
        note,
        octave,
        cents,
        confidence: result.confidence,
        rms,
      })
    } else {
      setState({ freq: null, note: null, octave: null, cents: null, confidence: null, rms })
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (!stream) return

    const ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 4096
    const source = ctx.createMediaStreamSource(stream)
    const gain = ctx.createGain()
    gain.gain.value = inputGain ?? 1.0
    source.connect(gain)
    gain.connect(analyser)

    ctxRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source
    gainRef.current = gain

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (gainRef.current) gainRef.current.disconnect()
      if (sourceRef.current) sourceRef.current.disconnect()
      if (ctxRef.current) ctxRef.current.close()
      ctxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
      gainRef.current = null
    }
  }, [stream, tick])

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = inputGain ?? 1.0
    }
  }, [inputGain])

  return state
}
