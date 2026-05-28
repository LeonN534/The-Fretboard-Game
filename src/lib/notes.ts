export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type NoteName = typeof CHROMATIC[number]

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

export function chromaticIndex(note: string): number {
  return NOTE_TO_INDEX[note] ?? 0
}

export function noteName(note: string): string {
  return note.replace(/[0-9]/g, '')
}

export function noteOctave(note: string): number {
  const m = note.match(/(\d+)$/)
  return m ? parseInt(m[1], 10) : 0
}

export function parseNote(full: string): { name: string; octave: number } {
  return { name: noteName(full), octave: noteOctave(full) }
}

export function midiNumber(note: string, octave: number): number {
  return (octave + 1) * 12 + chromaticIndex(note)
}

export function frequency(note: string, octave: number): number {
  return 440 * Math.pow(2, (midiNumber(note, octave) - 69) / 12)
}

export function noteAtFret(openNote: string, fret: number): { name: string; octave: number } {
  const base = parseNote(openNote)
  const semitones = chromaticIndex(base.name) + fret
  const name = CHROMATIC[semitones % 12]
  const octave = base.octave + Math.floor(semitones / 12)
  return { name, octave }
}

const STANDARD_TUNING: Record<number, string[]> = {
  6: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  7: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2', 'B1'],
  8: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2', 'B1', 'F#1'],
}

export function getOpenNote(stringIndex: number, stringsCount: number): string {
  const tuning = STANDARD_TUNING[stringsCount]
  if (!tuning || stringIndex < 0 || stringIndex >= tuning.length) return 'E4'
  return tuning[stringIndex]
}

export function noteFrequency(noteName: string, octave: number): number {
  return frequency(noteName, octave)
}

export function getStringLabel(stringIndex: number): string {
  return `${stringIndex + 1}`
}

export function getFretPositions(
  stringIndex: number,
  targetNote: string,
  stringsCount: number,
  fretsCount: number,
): number[] {
  const open = getOpenNote(stringIndex, stringsCount)
  const base = parseNote(open)
  const targetIdx = chromaticIndex(targetNote)
  const positions: number[] = []

  for (let f = 0; f <= fretsCount; f++) {
    const noteAt = (chromaticIndex(base.name) + f) % 12
    if (noteAt === targetIdx) {
      positions.push(f)
    }
  }

  return positions
}

export function getAllNotesOnString(
  stringIndex: number,
  stringsCount: number,
  fretsCount: number,
): Array<{ name: string; octave: number; fret: number }> {
  const open = getOpenNote(stringIndex, stringsCount)
  const result: Array<{ name: string; octave: number; fret: number }> = []
  for (let f = 0; f <= fretsCount; f++) {
    const { name, octave } = noteAtFret(open, f)
    result.push({ name, octave, fret: f })
  }
  return result
}

export function getUniqueNotesOnString(
  stringIndex: number,
  stringsCount: number,
  fretsCount: number,
): string[] {
  const seen = new Set<string>()
  const open = getOpenNote(stringIndex, stringsCount)
  for (let f = 0; f <= fretsCount; f++) {
    const { name } = noteAtFret(open, f)
    seen.add(name)
  }
  return Array.from(seen)
}

export function getUniquePitchesOnString(
  stringIndex: number,
  stringsCount: number,
  fretsCount: number,
): Array<{ name: string; octave: number; firstFret: number }> {
  const seen = new Set<string>()
  const open = getOpenNote(stringIndex, stringsCount)
  const result: Array<{ name: string; octave: number; firstFret: number }> = []
  for (let f = 0; f <= fretsCount; f++) {
    const { name, octave } = noteAtFret(open, f)
    const key = `${name}|${octave}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ name, octave, firstFret: f })
    }
  }
  return result
}

export interface Question {
  stringIndex: number
  noteName: string
  octave: number
  positions: number[]
  positionCount: number
}

export function generateRandomQuestion(
  stringsCount: number,
  fretsCount: number,
): Question {
  const si = Math.floor(Math.random() * stringsCount)
  const uniquePitches = getUniquePitchesOnString(si, stringsCount, fretsCount)
  const pitch = uniquePitches[Math.floor(Math.random() * uniquePitches.length)]
  return {
    stringIndex: si,
    noteName: pitch.name,
    octave: pitch.octave,
    positions: [pitch.firstFret],
    positionCount: 1,
  }
}

export function generateStringQuestions(
  stringIndex: number,
  count: number,
  stringsCount: number,
  fretsCount: number,
): Question[] {
  const uniquePitches = getUniquePitchesOnString(stringIndex, stringsCount, fretsCount)
  const shuffled = [...uniquePitches].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((pitch) => ({
    stringIndex,
    noteName: pitch.name,
    octave: pitch.octave,
    positions: [pitch.firstFret],
    positionCount: 1,
  }))
}

export function noteToFreq(note: string, octave: number): number {
  return frequency(note, octave)
}

export function freqToNote(freq: number): { name: string; octave: number; cents: number } {
  if (freq <= 0) return { name: 'C', octave: 0, cents: 0 }
  const midi = 12 * Math.log2(freq / 440) + 69
  const midiRounded = Math.round(midi)
  const cents = Math.round((midi - midiRounded) * 100)
  const octave = Math.floor(midiRounded / 12) - 1
  const nameIdx = midiRounded % 12
  return { name: CHROMATIC[nameIdx >= 0 ? nameIdx : nameIdx + 12], octave, cents }
}

export const STRING_NAMES: Record<number, string[]> = {
  6: ['E', 'B', 'G', 'D', 'A', 'E'],
  7: ['E', 'B', 'G', 'D', 'A', 'E', 'B'],
  8: ['E', 'B', 'G', 'D', 'A', 'E', 'B', 'F#'],
}
