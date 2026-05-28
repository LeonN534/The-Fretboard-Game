import { ChevronDown } from "lucide-react";
import type { StringsCount, FretsCount } from "@/hooks/useGuitarConfig";

interface GuitarConfigPanelProps {
  strings: StringsCount
  frets: FretsCount
  onStringsChange: (s: StringsCount) => void
  onFretsChange: (f: FretsCount) => void
}

const STRING_OPTIONS: StringsCount[] = [6, 7, 8]
const FRET_OPTIONS: FretsCount[] = [21, 22, 24]

function GuitarConfigPanel({
  strings,
  frets,
  onStringsChange,
  onFretsChange,
}: GuitarConfigPanelProps) {
  return (
    <div className="w-full">
      <div className="mb-4 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Guitar Configuration
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Strings
          </label>
          <div className="relative">
            <select
              value={strings}
              onChange={(e) => onStringsChange(Number(e.target.value) as StringsCount)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card/80 px-3 py-2.5 pr-10 text-sm text-foreground ring-accent/30 transition-all duration-200 focus:border-accent/50 focus:outline-none focus:ring-2"
            >
              {STRING_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} strings
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Frets
          </label>
          <div className="relative">
            <select
              value={frets}
              onChange={(e) => onFretsChange(Number(e.target.value) as FretsCount)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card/80 px-3 py-2.5 pr-10 text-sm text-foreground ring-accent/30 transition-all duration-200 focus:border-accent/50 focus:outline-none focus:ring-2"
            >
              {FRET_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} frets
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuitarConfigPanel;
