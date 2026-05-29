import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { playCountdownBeep, playGoBeep } from "@/lib/soundManager";

function Countdown() {
  const setScreen = useStore((s) => s.setScreen);
  const [phase, setPhase] = useState<'3' | '2' | '1' | 'go'>('3');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sequence = async () => {
      playCountdownBeep()
      await sleep(800);
      setPhase('2');
      playCountdownBeep()
      await sleep(800);
      setPhase('1');
      playCountdownBeep()
      await sleep(800);
      setPhase('go');
      playGoBeep()
      await sleep(600);
      setScreen('game-play');
    };
    sequence();
  }, [setScreen]);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const isGo = phase === 'go';

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-8">
        <img src="/logo.png" alt="Fretboard Game" className="h-20 w-20 object-contain" />

        <div
          className={`font-righteous text-8xl tracking-widest transition-all duration-300 ${
            isGo ? 'scale-100 text-green-400' : 'scale-100 text-accent'
          }`}
        >
          {isGo ? 'GO!' : phase}
        </div>

        <div className="text-sm text-muted-foreground animate-pulse">
          {isGo ? 'Play the notes!' : 'Get ready...'}
        </div>
      </div>
    </div>
  );
}

export default Countdown;
