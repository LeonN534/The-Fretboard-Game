import { Play, Settings, LogOut, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

const GITHUB_URL = 'https://github.com/LeonN534/The-Fretboard-Game';

interface MainMenuProps {
  onStartGame: () => void;
}

function MainMenu({ onStartGame }: MainMenuProps) {
  const setScreen = useStore((s) => s.setScreen);

  const handleOpenDocs = () => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(GITHUB_URL);
    } else {
      window.open(GITHUB_URL, '_blank');
    }
  };

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="animate-fade-in flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Fretboard Game" className="h-14 w-14 object-contain" />
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
            className="h-14 w-full gap-3 bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-[#45C9BA] hover:shadow-accent/40 active:scale-[0.98]"
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

          <button
            onClick={handleOpenDocs}
            className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-accent"
          >
            <ExternalLink className="h-3 w-3" />
            View Documentation
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60">v0.1.0</p>
      </div>
    </div>
  );
}

export default MainMenu;
