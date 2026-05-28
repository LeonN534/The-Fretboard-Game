import { Monitor, MonitorOff, ChevronDown, Volume2 } from "lucide-react";
import VolumeMeter from "@/components/VolumeMeter";

interface AudioSettingsPanelProps {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string | null
  isMonitoring: boolean
  level: number
  isStreaming: boolean
  inputGain: number
  onSelectDevice: (deviceId: string) => void
  onToggleMonitor: () => void
  onInputGainChange: (gain: number) => void
}

function AudioSettingsPanel({
  devices,
  selectedDeviceId,
  isMonitoring,
  level,
  isStreaming,
  inputGain,
  onSelectDevice,
  onToggleMonitor,
  onInputGainChange,
}: AudioSettingsPanelProps) {
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) onSelectDevice(id);
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Input Device
      </div>
      <div className="relative mb-8">
        <select
          value={selectedDeviceId ?? ""}
          onChange={handleDeviceChange}
          className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card/80 px-3 py-2.5 pr-10 text-sm text-foreground ring-accent/30 transition-all duration-200 focus:border-accent/50 focus:outline-none focus:ring-2"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="mb-3">
        <VolumeMeter level={level} />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Volume2 className="h-3.5 w-3.5" />
            Input Volume
          </span>
          <span className="text-foreground tabular-nums">
            {Math.round(inputGain * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={25}
          max={400}
          value={Math.round(inputGain * 100)}
          onChange={(e) => onInputGainChange(parseInt(e.target.value, 10) / 100)}
          className="w-full cursor-pointer accent-accent"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/50">
          <span>0.25x</span>
          <span>4x</span>
        </div>
      </div>

      <button
        onClick={onToggleMonitor}
        disabled={!isStreaming}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-left text-sm text-foreground transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${
            isMonitoring ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground"
          }`}
        >
          {isMonitoring ? (
            <Monitor className="h-4 w-4" />
          ) : (
            <MonitorOff className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium">Monitor</div>
          <div className="text-[11px] text-muted-foreground">
            {isMonitoring ? "Hearing yourself" : "Tap to hear yourself"}
          </div>
        </div>
        <div
          className={`h-5 w-9 rounded-full p-0.5 transition-colors duration-200 ${
            isMonitoring ? "bg-accent" : "bg-white/10"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
              isMonitoring ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </button>

      {isMonitoring && (
        <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/8 px-3 py-2 text-center text-[11px] text-yellow-400/70">
          Use headphones to avoid audio feedback
        </div>
      )}
    </div>
  );
}

export default AudioSettingsPanel;
