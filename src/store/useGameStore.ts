import { create } from 'zustand'
import type { Question } from '@/lib/notes'

export type Difficulty = 'strummer' | 'lead' | 'rockstar'
export type GameMode = 'all-strings' | 'per-string'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  strummer: 'Strummer',
  lead: 'Lead',
  rockstar: 'Rockstar',
}

export const DIFFICULTY_TIMES: Record<Difficulty, number> = {
  strummer: 15,
  lead: 7,
  rockstar: 3,
}

export interface AnswerRecord {
  stringIndex: number
  noteName: string
  correct: boolean
  timeMs: number
  timestamp: number
}

export interface StringStats {
  stringIndex: number
  total: number
  correct: number
  errors: number
  totalTimeMs: number
}

export interface GameStats {
  totalQuestions: number
  correct: number
  errors: number
  avgTimeMs: number
  sessionDurationMs: number
  stringStats: StringStats[]
  missedNotes: Array<{ noteName: string; stringIndex: number; count: number }>
}

export interface GameState {
  difficulty: Difficulty
  mode: GameMode
  sessionTimer: number
  questions: Question[]
  currentQIndex: number
  currentStringPerString: number
  answers: AnswerRecord[]
  isTuned: boolean
  isRunning: boolean
  sessionStartTime: number
  questionStartTime: number
  currentHitPositions: number[]
  lastHitCorrect: boolean | null
  lastHitNote: string | null

  setDifficulty: (d: Difficulty) => void
  setMode: (m: GameMode) => void
  setSessionTimer: (t: number) => void
  setTuned: (v: boolean) => void
  startSession: () => void
  initAllStringsQuestions: (count: number) => void
  initPerStringQuestions: (perString: number) => void
  nextQuestion: () => void
  recordAnswer: (stringIndex: number, noteName: string, correct: boolean) => void
  recordHitPosition: (fret: number) => void
  clearHitPositions: () => void
  setLastHitCorrect: (correct: boolean | null, note: string | null) => void
  getStats: () => GameStats
  reset: () => void
}

const initialQuestions: Question[] = []

export const useGameStore = create<GameState>((set, get) => ({
  difficulty: 'strummer',
  mode: 'all-strings',
  sessionTimer: 5,
  questions: initialQuestions,
  currentQIndex: 0,
  currentStringPerString: 0,
  answers: [],
  isTuned: false,
  isRunning: false,
  sessionStartTime: 0,
  questionStartTime: 0,
  currentHitPositions: [],
  lastHitCorrect: null,
  lastHitNote: null,

  setDifficulty: (d) => set({ difficulty: d }),
  setMode: (m) => set({ mode: m }),
  setSessionTimer: (t) => set({ sessionTimer: t }),
  setTuned: (v) => set({ isTuned: v }),

  startSession: () =>
    set({
      isRunning: true,
      sessionStartTime: Date.now(),
      questionStartTime: Date.now(),
      currentQIndex: 0,
      currentStringPerString: 0,
      answers: [],
      currentHitPositions: [],
      lastHitCorrect: null,
      lastHitNote: null,
    }),

  initAllStringsQuestions: (_count) => {
    set({ questions: [], currentQIndex: 0 })
  },

  initPerStringQuestions: (_perString) => {
    set({ questions: [], currentQIndex: 0, currentStringPerString: 0 })
  },

  nextQuestion: () => {
    const state = get()
    set({
      currentQIndex: state.currentQIndex + 1,
      questionStartTime: Date.now(),
      currentHitPositions: [],
      lastHitCorrect: null,
      lastHitNote: null,
    })
  },

  recordAnswer: (stringIndex, noteName, correct) => {
    const state = get()
    const timeMs = Date.now() - state.questionStartTime
    const answer: AnswerRecord = {
      stringIndex,
      noteName,
      correct,
      timeMs,
      timestamp: Date.now(),
    }
    set({ answers: [...state.answers, answer] })
  },

  recordHitPosition: (fret) => {
    const state = get()
    if (!state.currentHitPositions.includes(fret)) {
      set({ currentHitPositions: [...state.currentHitPositions, fret] })
    }
  },

  clearHitPositions: () => set({ currentHitPositions: [] }),

  setLastHitCorrect: (correct, note) =>
    set({ lastHitCorrect: correct, lastHitNote: note }),

  getStats: () => {
    const state = get()
    const totalQuestions = state.answers.length
    const correct = state.answers.filter((a) => a.correct).length
    const errors = totalQuestions - correct
    const totalTimeMs = state.answers.reduce((s, a) => s + a.timeMs, 0)
    const avgTimeMs = totalQuestions > 0 ? totalTimeMs / totalQuestions : 0
    const sessionDurationMs = state.sessionStartTime
      ? Date.now() - state.sessionStartTime
      : 0

    const stringStatsMap = new Map<number, StringStats>()
    for (const a of state.answers) {
      let s = stringStatsMap.get(a.stringIndex)
      if (!s) {
        s = {
          stringIndex: a.stringIndex,
          total: 0,
          correct: 0,
          errors: 0,
          totalTimeMs: 0,
        }
        stringStatsMap.set(a.stringIndex, s)
      }
      s.total++
      s.totalTimeMs += a.timeMs
      if (a.correct) s.correct++
      else s.errors++
    }
    const stringStats = Array.from(stringStatsMap.values()).sort(
      (a, b) => a.stringIndex - b.stringIndex,
    )

    const missedMap = new Map<string, number>()
    for (const a of state.answers) {
      if (!a.correct) {
        const key = `${a.noteName}|${a.stringIndex}`
        missedMap.set(key, (missedMap.get(key) ?? 0) + 1)
      }
    }
    const missedNotes = Array.from(missedMap.entries())
      .map(([key, count]) => {
        const [noteName, si] = key.split('|')
        return { noteName: noteName!, stringIndex: parseInt(si!, 10), count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalQuestions,
      correct,
      errors,
      avgTimeMs,
      sessionDurationMs,
      stringStats,
      missedNotes,
    }
  },

  reset: () =>
    set({
      questions: [],
      currentQIndex: 0,
      currentStringPerString: 0,
      answers: [],
      isRunning: false,
      sessionStartTime: 0,
      questionStartTime: 0,
      currentHitPositions: [],
      lastHitCorrect: null,
      lastHitNote: null,
    }),
}))
