import { ArrowLeft, Sparkles, Zap, Star, Shuffle, ListOrdered, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGameStore } from "@/store/useGameStore";
import type { Difficulty } from "@/store/useGameStore";
import { Button } from "@/components/ui/button";

const DIFFICULTY_META: Array<{
  key: Difficulty;
  label: string;
  icon: typeof Sparkles;
  desc: string;
  color: string;
}> = [
  {
    key: 'strummer',
    label: 'Strummer',
    icon: Sparkles,
    desc: 'Casual • 15s per question',
    color: 'border-green-500/40 bg-green-500/10 text-green-400',
  },
  {
    key: 'lead',
    label: 'Lead',
    icon: Zap,
    desc: 'Intermediate • 7s per question',
    color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  },
  {
    key: 'rockstar',
    label: 'Rockstar',
    icon: Star,
    desc: 'Expert • 3s per question',
    color: 'border-red-500/40 bg-red-500/10 text-red-400',
  },
];

const TIMER_OPTIONS = [1, 3, 5, 10];

function ModeSelect() {
  const setScreen = useStore((s) => s.setScreen);
  const {
    difficulty,
    mode,
    sessionTimer,
    setDifficulty,
    setMode,
    setSessionTimer,
    startSession,
  } = useGameStore();

  const handleBack = () => {
    setScreen('tuner');
  };

  const handleStart = () => {
    startSession();
    setScreen('countdown');
  };

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

        <div className="mb-8 text-center">
          <h1 className="font-righteous text-3xl tracking-wide text-foreground">
            SELECT CHALLENGE
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose difficulty and mode
          </p>
        </div>

        <div className="mb-8">
          <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Difficulty
          </div>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_META.map((d) => {
              const selected = difficulty === d.key;
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                    selected
                      ? `${d.color} ring-1 ring-accent/40`
                      : 'border-border/40 bg-card/30 text-muted-foreground hover:border-border/60 hover:bg-card/50'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      selected ? '' : 'text-muted-foreground/50'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      selected ? '' : 'text-foreground/80'
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="text-[10px] leading-tight opacity-70">
                    {d.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Mode
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('all-strings')}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                mode === 'all-strings'
                  ? 'border-accent/50 bg-accent/10 ring-1 ring-accent/30'
                  : 'border-border/40 bg-card/30 hover:border-border/60'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  mode === 'all-strings'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-white/5 text-muted-foreground'
                }`}
              >
                <Shuffle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">All Strings</div>
                <div className="text-xs text-muted-foreground">
                  Random strings and notes, timed session
                </div>
              </div>
              <div
                className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                  mode === 'all-strings' ? 'bg-accent' : 'bg-white/10'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    mode === 'all-strings' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setMode('per-string')}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                mode === 'per-string'
                  ? 'border-accent/50 bg-accent/10 ring-1 ring-accent/30'
                  : 'border-border/40 bg-card/30 hover:border-border/60'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  mode === 'per-string'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-white/5 text-muted-foreground'
                }`}
              >
                <ListOrdered className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">10 per String</div>
                <div className="text-xs text-muted-foreground">
                  20 questions per string, string by string
                </div>
              </div>
              <div
                className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                  mode === 'per-string' ? 'bg-accent' : 'bg-white/10'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    mode === 'per-string' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {mode === 'all-strings' && (
          <div className="mb-8">
            <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Session Timer
            </div>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionTimer(t)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${
                    sessionTimer === t
                      ? 'border-accent/50 bg-accent/10 text-accent ring-1 ring-accent/30'
                      : 'border-border/40 bg-card/30 text-muted-foreground hover:border-border/60'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {t}m
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleStart}
          size="lg"
          className="mt-auto h-14 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-[#45C9BA] active:scale-[0.98]"
        >
          START CHALLENGE
        </Button>
      </div>
    </div>
  );
}

export default ModeSelect;
