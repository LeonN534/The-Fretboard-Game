import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Music2, Guitar, CheckCircle2, Circle, Volume2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAudio } from "@/hooks/useAudio";
import { useAudioConfig } from "@/hooks/useAudioConfig";
import { useGuitarConfig } from "@/hooks/useGuitarConfig";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { getOpenNote, noteFrequency, parseNote, chromaticIndex, STRING_NAMES } from "@/lib/notes";
import { freqToPitch } from "@/lib/pitchDetection";

function Tuner() {
  const setScreen = useStore((s) => s.setScreen);
  const { loadConfig: loadAudioCfg, saveInputGain } = useAudioConfig();
  const { loadConfig: loadGuitarCfg } = useGuitarConfig();
  const audioCfg = loadAudioCfg();
  const guitarCfg = loadGuitarCfg();
  const inputGain = audioCfg?.inputGain ?? 1.0;

  const audio = useAudio(audioCfg?.deviceId, inputGain);
  const pitch = usePitchDetection(audio.stream, inputGain);

  const [selectedString, setSelectedString] = useState(0);
  const [tunedStrings, setTunedStrings] = useState<boolean[]>([]);
  const [centsOff, setCentsOff] = useState<number | null>(null);
  const [tunerStatus, setTunerStatus] = useState<'waiting' | 'flat' | 'in-tune' | 'sharp'>('waiting');
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stringsCount = guitarCfg.strings;

  useEffect(() => {
    setTunedStrings(new Array(stringsCount).fill(false));
  }, [stringsCount]);

  const handleBack = () => {
    audio.cleanup();
    setScreen("menu");
  };

  const handleSelectString = (idx: number) => {
    setSelectedString(idx);
    setCentsOff(null);
    setTunerStatus('waiting');
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
  };

  const targetNote = getOpenNote(selectedString, stringsCount);
  const targetFreq = noteFrequency(parseNote(targetNote).name, parseNote(targetNote).octave);
  const targetNoteName = parseNote(targetNote).name;

  useEffect(() => {
    if (!pitch.freq || !audio.isStreaming) return;

    const dp = freqToPitch(pitch.freq);
    if (dp.name !== targetNoteName) return;

    const semitones = chromaticIndex(targetNoteName);
    const rawMidi = 12 * Math.log2(pitch.freq / 440) + 69;
    const nearestMidi = semitones + Math.round((rawMidi - semitones) / 12) * 12;
    const nearestFreq = 440 * Math.pow(2, (nearestMidi - 69) / 12);
    const centsOff = Math.round(1200 * Math.log2(pitch.freq / nearestFreq));

    const tolerance = 8;
    if (Math.abs(centsOff) <= tolerance) {
      setTunerStatus('in-tune');
      setCentsOff(centsOff);
      setTunedStrings((prev) => {
        const next = [...prev];
        next[selectedString] = true;
        return next;
      });

      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        const nextString = (selectedString + 1) % stringsCount;
        if (nextString !== selectedString) {
          setSelectedString(nextString);
          setCentsOff(null);
          setTunerStatus('waiting');
        }
      }, 800);
    } else if (centsOff < -tolerance) {
      setTunerStatus('flat');
      setCentsOff(centsOff);
    } else {
      setTunerStatus('sharp');
      setCentsOff(centsOff);
    }
  }, [pitch.freq, audio.isStreaming, selectedString, targetNoteName, stringsCount]);

  useEffect(() => {
    return () => { audio.cleanup(); };
  }, []);

  const allTuned = tunedStrings.every(Boolean) && tunedStrings.length === stringsCount;

  const handleContinue = () => {
    audio.cleanup();
    setScreen('mode-select');
  };

  const needlePercent = centsOff !== null
    ? Math.max(-50, Math.min(50, centsOff)) / 50
    : 0;

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-xs text-muted-foreground/60">v0.1.0</span>
        </div>

        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/25">
            <Music2 className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="font-righteous text-3xl tracking-wide text-foreground">
            TUNE YOUR GUITAR
          </h1>
          <p className="text-sm text-muted-foreground">
            Tap a string, then play it
          </p>
        </div>

        <div className="mb-6 space-y-2">
          {Array.from({ length: stringsCount }).map((_, idx) => {
            const isSelected = selectedString === idx;
            const isTuned = tunedStrings[idx];
            return (
              <button
                key={idx}
                onClick={() => handleSelectString(idx)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                  isSelected
                    ? 'border-accent/50 bg-accent/10 ring-1 ring-accent/30'
                    : isTuned
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-border/60 bg-card/30 hover:border-border'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isTuned
                      ? 'bg-green-500/20 text-green-400'
                      : isSelected
                        ? 'bg-accent/20 text-accent'
                        : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  {isTuned ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <span className="flex-1">
                  <span className="font-medium">{idx + 1}</span>
                  <span className="ml-2 text-muted-foreground">
                    {STRING_NAMES[stringsCount]?.[idx]} ({targetNote})
                  </span>
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isTuned
                      ? 'text-green-400'
                      : isSelected
                        ? 'text-accent'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  {isTuned ? 'Tuned' : isSelected ? 'Selected' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {!audio.isStreaming && !audio.error && (
          <div className="mb-4 text-center text-sm text-muted-foreground">
            Connecting to microphone...
          </div>
        )}

        {audio.error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            {audio.error}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-border/40 bg-card/40 p-5">
          <div className="mb-3 text-center">
            <div className="font-righteous text-2xl text-foreground">
              {parseNote(targetNote).name}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {targetFreq.toFixed(1)} Hz
              {pitch.freq ? `  •  Played: ${pitch.freq.toFixed(1)} Hz` : ''}
            </div>
          </div>

          <div className="relative mb-3 h-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1 w-full rounded-full bg-white/10">
                <div className="relative h-full w-full rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 h-full w-1 rounded-full transition-all duration-100 ${
                      tunerStatus === 'in-tune'
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                        : tunerStatus === 'flat'
                          ? 'bg-yellow-400'
                          : tunerStatus === 'sharp'
                            ? 'bg-red-400'
                            : 'bg-white/20'
                    }`}
                    style={{
                      left: `${50 + needlePercent * 50}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-muted-foreground/50">
              <span>-50¢</span>
              <span className="text-accent/60">|</span>
              <span>+50¢</span>
            </div>

            <div
              className={`absolute left-1/2 top-0 -translate-x-1/2 text-center transition-all duration-300 ${
                tunerStatus === 'in-tune' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="text-lg leading-none">✓</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 text-xs">
            <span
              className={`font-medium transition-colors ${
                tunerStatus === 'flat' ? 'text-yellow-400' : 'text-muted-foreground/50'
              }`}
            >
              ♭ Flat
            </span>
            <span
              className={`font-medium transition-colors ${
                tunerStatus === 'in-tune' ? 'text-green-400' : 'text-muted-foreground/50'
              }`}
            >
              ✓ In Tune
            </span>
            <span
              className={`font-medium transition-colors ${
                tunerStatus === 'sharp' ? 'text-red-400' : 'text-muted-foreground/50'
              }`}
            >
              ♯ Sharp
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Volume2 className="h-3 w-3" />
              Input Volume
            </span>
            <span className="tabular-nums text-foreground">
              {Math.round(inputGain * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={25}
            max={400}
            value={Math.round(inputGain * 100)}
            onChange={(e) => saveInputGain(parseInt(e.target.value, 10) / 100)}
            className="w-full cursor-pointer accent-accent"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/50">
            <span>0.25x</span>
            <span>4x</span>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!allTuned}
          className={`flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
            allTuned
              ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:bg-[#3730A3]'
              : 'bg-white/5 text-muted-foreground'
          }`}
        >
          <Guitar className="h-5 w-5" />
          {allTuned
            ? `CONTINUE  (${tunedStrings.filter(Boolean).length}/${stringsCount})`
            : `TUNE ALL STRINGS  (${tunedStrings.filter(Boolean).length}/${stringsCount})`}
        </button>
      </div>
    </div>
  );
}

export default Tuner;
