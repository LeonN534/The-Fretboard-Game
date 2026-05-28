import { Play, Settings, LogOut, Music2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

interface MainMenuProps {
  onStartGame: () => void;
}

function MainMenu({ onStartGame }: MainMenuProps) {
  const setScreen = useStore((s) => s.setScreen);

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="animate-fade-in flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/25">
              <Music2 className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="font-righteous text-5xl tracking-wide text-foreground md:text-6xl">
              THE FRETBOARD
              <br />
              GAME
            </h1>
          </div>
          <p className="mt-1 animate-title-glow text-sm tracking-[0.3em] text-accent/80 uppercase">
            Master the fretboard
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button
            size="lg"
            className="h-14 w-full gap-3 bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-[#3730A3] hover:shadow-accent/40 active:scale-[0.98]"
            onClick={onStartGame}
          >
            <Play className="h-5 w-5 fill-current" />
            START GAME
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full gap-3 border-accent/40 text-accent transition-all duration-200 hover:bg-accent/10 hover:text-accent"
            onClick={() => setScreen("settings")}
          >
            <Settings className="h-5 w-5" />
            SETTINGS
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="h-12 w-full gap-3 text-muted-foreground transition-all duration-200 hover:text-foreground"
            onClick={() => {
              if (window.electronAPI) {
                window.electronAPI.quit();
              } else {
                window.close();
              }
            }}
          >
            <LogOut className="h-5 w-5" />
            EXIT
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">v0.1.0</p>
      </div>
    </div>
  );
}

export default MainMenu;
