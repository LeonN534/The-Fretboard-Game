import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { useGameStore, DIFFICULTY_TIMES } from "@/store/useGameStore";
import { useAudio } from "@/hooks/useAudio";
import { useAudioConfig } from "@/hooks/useAudioConfig";
import { useGuitarConfig } from "@/hooks/useGuitarConfig";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import {
  generateRandomQuestion,
  generateStringQuestions,
  getOpenNote,
} from "@/lib/notes";
import { matchNoteName } from "@/lib/pitchDetection";
import { playCorrect, playWrong, playCountdownBeep } from "@/lib/soundManager";
import type { Question } from "@/lib/notes";

function GameScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const store = useGameStore();
  const { loadConfig: loadAudioCfg } = useAudioConfig();
  const { loadConfig: loadGuitarCfg } = useGuitarConfig();
  const audioCfg = loadAudioCfg();
  const guitarCfg = loadGuitarCfg();

  const inputGain = audioCfg?.inputGain ?? 1.0;
  const audio = useAudio(audioCfg?.deviceId, inputGain);
  const pitch = usePitchDetection(audio.stream, inputGain);

  const timeLimitMs = DIFFICULTY_TIMES[store.difficulty] * 1000;
  const sessionLimitMs = store.sessionTimer * 60 * 1000;

  const [phase, setPhase] = useState<'playing' | 'correct' | 'wrong' | 'string-break'>('playing');
  const [qIndex, setQIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);
  const [stringBreakCount, setStringBreakCount] = useState(3);
  const [nextStringName, setNextStringName] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(true);

  const questionsRef = useRef<Question[]>([]);
  const phaseRef = useRef(phase);
  const qIndexRef = useRef(qIndex);
  const hasInited = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const wasSilentRef = useRef(true);
  const lockedRef = useRef(false);

  phaseRef.current = phase;
  qIndexRef.current = qIndex;

  useEffect(() => {
    if (hasInited.current) return;
    hasInited.current = true;

    sessionStartRef.current = Date.now();

    if (store.mode === 'all-strings') {
      const qs: Question[] = [];
      for (let i = 0; i < 60; i++) {
        qs.push(generateRandomQuestion(guitarCfg.strings, guitarCfg.frets));
      }
      questionsRef.current = qs;
    } else {
      const all: Question[] = [];
      for (let s = 0; s < guitarCfg.strings; s++) {
        const sq = generateStringQuestions(s, 20, guitarCfg.strings, guitarCfg.frets);
        all.push(...sq);
      }
      questionsRef.current = all;
    }

    return () => { audio.cleanup(); };
  }, []);

  const currentQ = questionsRef.current[qIndex] ?? null;

  const getQuestion = (idx: number): Question | null => {
    const qs = questionsRef.current;
    if (idx >= qs.length) {
      if (store.mode === 'all-strings') {
        const q = generateRandomQuestion(guitarCfg.strings, guitarCfg.frets);
        qs.push(q);
        return q;
      }
      return null;
    }
    return qs[idx];
  };

  useEffect(() => {
    if (!audio.isStreaming || phaseRef.current !== 'playing') return;
    const p = pitch;
    const silent = !p.rms || p.rms < 0.003;

    if (silent) {
      wasSilentRef.current = true
      lockedRef.current = false
      return
    }

    if (lockedRef.current) return
    if (!wasSilentRef.current) return
    wasSilentRef.current = false
    lockedRef.current = true

    if (!p.confidence || p.confidence < 0.1 || !p.freq) return

    const q = getQuestion(qIndexRef.current)
    if (!q) return

    const result = matchNoteName(p.freq, 50)
    if (!result.match) return

    if (result.name === q.noteName) {
      handleCorrect(q)
    } else {
      showWrongFlash()
    }
  }, [pitch])

  function handleCorrect(q: Question) {
    if (phaseRef.current !== 'playing') return;
    playCorrect()
    setPhase('correct');
    setFeedbackCorrect(true);
    setShowFeedback(true);
    store.recordAnswer(q.stringIndex, q.noteName, true);
    trackElapsed(false);

    setTimeout(() => advance(), 600);
  }

  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  function showWrongFlash() {
    if (phaseRef.current !== 'playing') return;
    playWrong()
    setPhase('wrong');
    setFeedbackCorrect(false);
    setShowFeedback(true);
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
    wrongTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'wrong') {
        setPhase('playing');
        setShowFeedback(false);
        trackElapsed(true);
      }
    }, 300);
  }

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const trackElapsed = (start: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (start) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;

        const q = getQuestion(qIndexRef.current);
        if (q && elapsed >= timeLimitMs && phaseRef.current === 'playing') {
          clearInterval(timerRef.current);
          store.recordAnswer(q.stringIndex, q.noteName, false);
          setPhase('wrong');
          setFeedbackCorrect(false);
          setShowFeedback(true);
          setTimeout(() => advance(), 600);
        }

        setElapsedMs(elapsed);
      }, 50);
    }
  };

  useEffect(() => {
    if (phase === 'playing') {
      setShowFeedback(false);
      trackElapsed(true);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, qIndex]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      const ses = Date.now() - sessionStartRef.current;
      setSessionElapsedMs(ses);
      if (store.mode === 'all-strings' && ses >= sessionLimitMs) {
        clearInterval(interval);
        setScreen('report');
        store.reset();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  function advance() {
    const nextIdx = qIndexRef.current + 1;
    const nextQ = getQuestion(nextIdx);

    if (!nextQ) {
      setScreen('report');
      return;
    }

    if (store.mode === 'per-string') {
      const curStr = getQuestion(qIndexRef.current)?.stringIndex;
      const nextStr = nextQ.stringIndex;
      if (nextStr !== curStr && curStr !== undefined) {
        startStringBreak(nextStr, nextIdx);
        return;
      }
    }

    setQIndex(nextIdx);
    setElapsedMs(0);
    setPhase('playing');
  }

  function startStringBreak(stringIdx: number, nextQIdx: number) {
    setNextStringName(getOpenNote(stringIdx, guitarCfg.strings));
    setPhase('string-break');
    let count = 3;
    setStringBreakCount(count);
    playCountdownBeep();
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setQIndex(nextQIdx);
        setElapsedMs(0);
        setPhase('playing');
      } else {
        setStringBreakCount(count);
        playCountdownBeep();
      }
    }, 1000);
  }

  const timerPercent = Math.min(elapsedMs / timeLimitMs, 1);
  const sessionPercent = store.mode === 'all-strings'
    ? Math.min(sessionElapsedMs / sessionLimitMs, 1)
    : 0;

  const stringName = currentQ ? getOpenNote(currentQ.stringIndex, guitarCfg.strings) : '';

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col overflow-hidden">
      {phase === 'string-break' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
          <div className="mb-4 text-sm text-white/60 uppercase tracking-wider">
            Next String
          </div>
          <div className="mb-4 text-5xl font-righteous text-white drop-shadow-lg">
            {nextStringName}
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <span className="text-6xl font-righteous text-white">
              {stringBreakCount}
            </span>
          </div>
        </div>
      )}

      {showFeedback && (
        <div
          className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-200 ${
            feedbackCorrect
              ? 'bg-green-500/10'
              : 'bg-red-500/10'
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`text-7xl font-righteous ${
              feedbackCorrect ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {feedbackCorrect ? '✓' : '✗'}
          </div>
        </div>
      )}

      {/* Session timer */}
      {store.mode === 'all-strings' && (
        <div className="absolute left-3 top-3 z-30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(1 - sessionPercent) * 100}%` }}
              />
            </div>
            <span className="tabular-nums">
              {Math.max(0, Math.ceil((sessionLimitMs - sessionElapsedMs) / 60000))}m
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setScreen('report')}
            className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            End
          </button>
          <span className="text-xs text-muted-foreground/60">
            {qIndex + 1}
          </span>
        </div>

        {!audio.isStreaming && (
          <div className="mb-4 text-center text-sm text-muted-foreground">
            Connecting to microphone...
          </div>
        )}

        <div className="mb-6 flex flex-1 flex-col items-center justify-center">
          {currentQ && (
            <>
              <div className="mb-2 text-center">
                <div className="text-lg font-bold uppercase tracking-widest text-foreground">
                  STRING {currentQ.stringIndex + 1} ({stringName})
                </div>
                <div className="mx-auto mt-1 h-0.5 w-16 rounded-full bg-accent" />
              </div>

              <div className="mb-2 mt-4 font-righteous text-7xl tracking-wide text-foreground">
                {currentQ.noteName}{currentQ.octave}
              </div>

              <div className="mb-8 w-full max-w-[200px]">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      timerPercent > 0.8
                        ? 'bg-red-400'
                        : timerPercent > 0.5
                          ? 'bg-yellow-400'
                          : 'bg-accent'
                    }`}
                    style={{ width: `${(1 - timerPercent) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-center text-[10px] text-muted-foreground">
                  {Math.max(0, Math.ceil((timeLimitMs - elapsedMs) / 1000))}s
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {questionsRef.current.slice(0, Math.min(questionsRef.current.length, 60)).map((_q, i) => (
            <div
              key={i}
              className={`h-1.5 w-4 rounded-full transition-colors ${
                i < qIndex
                  ? 'bg-muted-foreground/30'
                  : i === qIndex
                    ? 'bg-accent'
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
