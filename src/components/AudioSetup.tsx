import { useEffect, useRef, useState } from "react";
import { Mic, ArrowLeft } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAudio } from "@/hooks/useAudio";
import { useAudioConfig } from "@/hooks/useAudioConfig";
import AudioSettingsPanel from "@/components/AudioSettingsPanel";
import { Button } from "@/components/ui/button";

function AudioSetup() {
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
  } = useAudio(undefined, inputGain);

  const [selDevInit, setSelDevInit] = useState(false);

  const handleBack = () => {
    cleanup();
    setScreen("menu");
  };

  const handleContinue = () => {
    if (selectedDeviceId) {
      const device = devices.find((d) => d.deviceId === selectedDeviceId);
      saveConfig(selectedDeviceId, device?.label || "Unknown device");
    }
    setScreen("game");
  };

  const handleRequestMic = async () => {
    await requestPermission();
    setSelDevInit(false);
  };

  const prevDev = useRef(0);

  useEffect(() => {
    if (devices.length > 0 && devices.length !== prevDev.current) {
      prevDev.current = devices.length;
      if (!selectedDeviceId && !selDevInit) {
        const id = devices[0].deviceId;
        setSelDevInit(true);
        selectDevice(id);
      }
    }
  }, [devices, selectedDeviceId, selectDevice, selDevInit]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const noDevices = devices.length === 0;
  const showDeviceList = isPermissionGranted && !noDevices;

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
            <Mic className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="font-righteous text-3xl tracking-wide text-foreground">
            AUDIO SETUP
          </h1>
          <p className="text-sm text-muted-foreground">
            Select your audio input
          </p>
        </div>

        {!isPermissionGranted && !error && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              This game needs access to your microphone
              <br />
              to detect your guitar playing.
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
            <p className="mt-1 text-xs text-yellow-400/70">
              Connect a microphone or audio interface.
            </p>
            <button
              onClick={refreshDevices}
              className="mt-2 cursor-pointer text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
            >
              Refresh
            </button>
          </div>
        )}

        {showDeviceList && (
          <>
            <AudioSettingsPanel
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              isMonitoring={isMonitoring}
              level={level}
              isStreaming={isStreaming}
              inputGain={inputGain}
              onSelectDevice={selectDevice}
              onToggleMonitor={toggleMonitor}
              onInputGainChange={(gain) => saveInputGain(gain)}
            />

            <Button
              onClick={handleContinue}
              disabled={!isStreaming}
              size="lg"
              className="mt-6 h-14 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-[#3730A3] hover:shadow-accent/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              CONTINUE
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default AudioSetup;
