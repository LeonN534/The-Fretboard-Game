import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useGameStore } from "@/store/useGameStore";
import { useGuitarConfig } from "@/hooks/useGuitarConfig";
import { STRING_NAMES } from "@/lib/notes";
import { Home, RefreshCw, Clock, Target, XCircle, BarChart3, AlertTriangle } from "lucide-react";

function ReportScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const { reset, getStats, answers } = useGameStore();
  const { loadConfig } = useGuitarConfig();
  const guitarCfg = loadConfig();

  const stats = useMemo(() => getStats(), [getStats, answers.length]);

  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correct / stats.totalQuestions) * 100)
    : 0;

  const totalSeconds = Math.round(stats.sessionDurationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const handleBackToMenu = () => {
    reset();
    setScreen('menu');
  };

  const handleTryAgain = () => {
    reset();
    setScreen('countdown');
  };

  const maxErrors = Math.max(...stats.stringStats.map((s) => s.errors), 1);

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8">
        <div className="mb-8 text-center">
          <h1 className="font-righteous text-3xl tracking-wide text-foreground">
            SESSION REPORT
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {minutes}m {seconds}s total
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card/30 p-3">
            <Target className="h-4 w-4 text-accent" />
            <div className="text-xl font-bold text-foreground">
              {accuracy}%
            </div>
            <div className="text-[10px] text-muted-foreground">Accuracy</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card/30 p-3">
            <Clock className="h-4 w-4 text-accent" />
            <div className="text-xl font-bold text-foreground">
              {stats.totalQuestions}
            </div>
            <div className="text-[10px] text-muted-foreground">Questions</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card/30 p-3">
            <XCircle className="h-4 w-4 text-red-400" />
            <div className="text-xl font-bold text-foreground">
              {stats.errors}
            </div>
            <div className="text-[10px] text-muted-foreground">Errors</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <BarChart3 className="h-3.5 w-3.5" />
            Errors per String
          </div>
          <div className="space-y-2">
            {stats.stringStats.map((s) => {
              const str = STRING_NAMES[guitarCfg.strings]?.[s.stringIndex] ?? '?';
              const pct = s.errors / maxErrors;
              return (
                <div key={s.stringIndex} className="flex items-center gap-3">
                  <span className="w-14 text-xs text-muted-foreground">
                    {s.stringIndex + 1} ({str})
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-3 rounded-full bg-red-400/70 transition-all"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground">
                    {s.errors}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {stats.missedNotes.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <AlertTriangle className="h-3.5 w-3.5" />
              Most Missed Notes
            </div>
            <div className="space-y-1.5">
              {stats.missedNotes.map((m, i) => {
                const str = STRING_NAMES[guitarCfg.strings]?.[m.stringIndex] ?? '?';
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {m.noteName}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        String {m.stringIndex + 1} ({str})
                      </span>
                    </span>
                    <span className="text-sm font-medium text-red-400">
                      x{m.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stats.stringStats.map((s) => {
          const strAcc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
          const avgTime = s.total > 0 ? Math.round(s.totalTimeMs / s.total) : 0;
          return (
            <div key={s.stringIndex} className="mb-1 px-3 py-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  String {s.stringIndex + 1}
                </span>
                <span className="text-foreground">
                  {s.correct}/{s.total} ({strAcc}%)
                  <span className="ml-2 text-muted-foreground">
                    ~{avgTime}ms avg
                  </span>
                </span>
              </div>
            </div>
          );
        })}

        <div className="mt-auto mb-8 flex flex-col gap-3">
          <button
            onClick={handleTryAgain}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-[#3730A3] active:scale-[0.98]"
          >
            <RefreshCw className="h-5 w-5" />
            TRY AGAIN
          </button>
          <button
            onClick={handleBackToMenu}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/40 bg-card/30 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportScreen;
