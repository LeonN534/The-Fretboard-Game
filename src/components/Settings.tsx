import { useEffect, useRef, useState } from "react";
import { Mic, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAudio } from "@/hooks/useAudio";
import { useAudioConfig } from "@/hooks/useAudioConfig";
import { useGuitarConfig } from "@/hooks/useGuitarConfig";
import type { StringsCount, FretsCount } from "@/hooks/useGuitarConfig";
import AudioSettingsPanel from "@/components/AudioSettingsPanel";
import GuitarConfigPanel from "@/components/GuitarConfigPanel";
import { Button } from "@/components/ui/button";

function Settings() {
  const setScreen = useStore((s) => s.setScreen);
  const { loadConfig, saveConfig, saveInputGain } = useAudioConfig();
  const config = loadConfig();
  const inputGain = config?.inputGain ?? 1.0;

  const {
    devices,
    selectedDeviceId,
    isMonitoring,
    level,
    isPermissionGranted,
    isStreaming,
    error,
    requestPermission,
    selectDevice,
    toggleMonitor,
    refreshDevices,
    cleanup,
  } = useAudio(config?.deviceId, inputGain);

  const { loadConfig: loadGuitarCfg, saveConfig: saveGuitarCfg } = useGuitarConfig();
  const initialGuitar = loadGuitarCfg();
  const [strings, setStrings] = useState<StringsCount>(initialGuitar.strings);
  const [frets, setFrets] = useState<FretsCount>(initialGuitar.frets);

  const handleStringsChange = (s: StringsCount) => {
    setStrings(s);
    saveGuitarCfg({ strings: s, frets });
  };

  const handleFretsChange = (f: FretsCount) => {
    setFrets(f);
    saveGuitarCfg({ strings, frets: f });
  };

  const [selDevInit, setSelDevInit] = useState(false);

  const handleBack = () => {
    cleanup();
    setScreen("menu");
  };

  const handleRequestMic = async () => {
    await requestPermission();
    setSelDevInit(false);
  };

  const handleSelectDevice = (deviceId: string) => {
    selectDevice(deviceId);
    const device = devices.find((d) => d.deviceId === deviceId);
    saveConfig(deviceId, device?.label || "Unknown device");
  };

  const prevDev = useRef(0);

  useEffect(() => {
    if (devices.length > 0 && devices.length !== prevDev.current) {
      prevDev.current = devices.length;
      if (!selectedDeviceId && !selDevInit) {
        setSelDevInit(true);
        const targetId = config?.deviceId && devices.some((d) => d.deviceId === config.deviceId)
          ? config.deviceId
          : devices[0].deviceId;
        handleSelectDevice(targetId);
      }
    }
  }, [devices]);

  const noDevices = devices.length === 0;
  const showControls = isPermissionGranted && !noDevices;

  return (
    <div className="bg-grid-glow relative flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-xs text-muted-foreground/60">v0.1.0</span>
        </div>

        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/25">
            <SettingsIcon className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="font-righteous text-3xl tracking-wide text-foreground">
            SETTINGS
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure your audio and guitar
          </p>
        </div>

        {!isPermissionGranted && !error && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Microphone access is needed
              <br />
              for guitar detection.
            </p>
            <Button
              onClick={handleRequestMic}
              size="lg"
              className="h-12 w-full max-w-xs gap-2 bg-accent text-accent-foreground transition-all duration-200 hover:bg-[#3730A3] active:scale-[0.98]"
            >
              <Mic className="h-5 w-5" />
              Enable Microphone
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            <p>{error}</p>
            <button
              onClick={handleRequestMic}
              className="mt-2 cursor-pointer text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
            >
              Try again
            </button>
          </div>
        )}

        {isPermissionGranted && noDevices && (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-400">
            <p>No audio input devices detected.</p>
            <button
              onClick={refreshDevices}
              className="mt-2 cursor-pointer text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
            >
              Refresh
            </button>
          </div>
        )}

        {showControls && (
          <AudioSettingsPanel
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            isMonitoring={isMonitoring}
            level={level}
            isStreaming={isStreaming}
            inputGain={inputGain}
            onSelectDevice={handleSelectDevice}
            onToggleMonitor={toggleMonitor}
            onInputGainChange={(gain) => saveInputGain(gain)}
          />
        )}

        <div className="my-8 border-t border-border/40" />

        <GuitarConfigPanel
          strings={strings}
          frets={frets}
          onStringsChange={handleStringsChange}
          onFretsChange={handleFretsChange}
        />
      </div>
    </div>
  );
}

export default Settings;
