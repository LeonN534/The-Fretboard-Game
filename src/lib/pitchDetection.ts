const NOTE_FREQ_CACHE = new Map<string, number>()

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_TO_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

function midiNumber(note: string, octave: number): number {
  return (octave + 1) * 12 + (NOTE_TO_INDEX[note] ?? 0)
}

function frequency(note: string, octave: number): number {
  const key = `${note}${octave}`
  let f = NOTE_FREQ_CACHE.get(key)
  if (f === undefined) {
    f = 440 * Math.pow(2, (midiNumber(note, octave) - 69) / 12)
    NOTE_FREQ_CACHE.set(key, f)
  }
  return f
}

function parabolicInterpolation(buffer: Float32Array, lag: number): number {
  const n = buffer.length
  if (lag < 1 || lag >= n - 1) return lag
  const y1 = buffer[lag - 1] ?? 0
  const y2 = buffer[lag] ?? 0
  const y3 = buffer[lag + 1] ?? 0
  const denom = 2 * (2 * y2 - y1 - y3)
  if (denom === 0) return lag
  return lag + (y1 - y3) / denom
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): { freq: number; confidence: number } | null {
  const size = buffer.length
  if (size < 2) return null

  const rms = Math.sqrt(
    buffer.reduce((sum, v) => sum + v * v, 0) / size,
  )
  if (rms < 0.003) return null
  const signalPower = rms * rms

  const minLag = Math.max(1, Math.round(sampleRate / 2000))
  const maxLag = Math.min(Math.round(sampleRate / 50), size / 2)
  if (maxLag <= minLag) return null

  const results: Array<{ lag: number; correlation: number }> = []
  let bestCorrelation = -Infinity
  let bestIndex = 0

  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0
    let count = 0
    for (let i = 0; i < size - lag; i++) {
      correlation += buffer[i] * buffer[i + lag]
      count++
    }
    correlation = count > 0 ? (correlation / count) / signalPower : 0
    results.push({ lag, correlation })

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestIndex = results.length - 1
    }
  }

  if (bestCorrelation < 0.15) return null

  const refinedLag = parabolicInterpolation(
    new Float32Array(results.map((r) => r.correlation)),
    bestIndex,
  )

  const actualLag = minLag + refinedLag
  const freq = sampleRate / actualLag

  return { freq, confidence: Math.min(bestCorrelation * 2, 1) }
}

export interface PitchResult {
  name: string
  octave: number
  freq: number
  cents: number
  confidence: number
}

export function freqToPitch(freq: number): PitchResult {
  if (freq <= 0) {
    return { name: 'C', octave: 0, freq: 0, cents: 0, confidence: 0 }
  }
  const midi = 12 * Math.log2(freq / 440) + 69
  const midiRounded = Math.round(midi)
  const cents = Math.round((midi - midiRounded) * 100)
  const octave = Math.floor(midiRounded / 12) - 1
  const nameIdx = ((midiRounded % 12) + 12) % 12
  return {
    name: CHROMATIC[nameIdx],
    octave,
    freq,
    cents,
    confidence: 1,
  }
}

const TARGET_NOTE_FREQ_CACHE = new Map<string, number>()

function targetFreq(name: string, octave: number): number {
  const key = `${name}${octave}`
  let f = TARGET_NOTE_FREQ_CACHE.get(key)
  if (f === undefined) {
    f = frequency(name, octave)
    TARGET_NOTE_FREQ_CACHE.set(key, f)
  }
  return f
}

export interface TunerResult {
  pitch: PitchResult
  targetFreq: number
  centsOff: number
  isInTune: boolean
  isFlat: boolean
  isSharp: boolean
}

export function tuneString(
  detectedFreq: number,
  targetName: string,
  targetOctave: number,
  toleranceCents = 8,
): TunerResult {
  const pitch = freqToPitch(detectedFreq)
  const tf = targetFreq(targetName, targetOctave)
  const centsOff = Math.round(1200 * Math.log2(detectedFreq / tf))
  return {
    pitch,
    targetFreq: tf,
    centsOff,
    isInTune: Math.abs(centsOff) <= toleranceCents,
    isFlat: centsOff < -toleranceCents,
    isSharp: centsOff > toleranceCents,
  }
}

export function matchNoteName(
  detectedFreq: number,
  toleranceCents = 50,
): { name: string; octave: number; cents: number; match: boolean } {
  const pitch = freqToPitch(detectedFreq)
  return {
    ...pitch,
    match: Math.abs(pitch.cents) <= toleranceCents,
  }
}
