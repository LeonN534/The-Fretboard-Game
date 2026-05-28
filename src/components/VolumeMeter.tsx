import { useEffect, useRef, useState } from 'react'

interface VolumeMeterProps {
  level: number
}

function VolumeMeter({ level }: VolumeMeterProps) {
  const [leftPeak, setLeftPeak] = useState(0)
  const [rightPeak, setRightPeak] = useState(0)
  const leftDecay = useRef(0)
  const rightDecay = useRef(0)

  const clamped = Math.min(level, 1)

  useEffect(() => {
    if (clamped > leftDecay.current) {
      leftDecay.current = clamped
    } else {
      leftDecay.current = Math.max(leftDecay.current - 0.02, clamped)
    }
    if (clamped > rightDecay.current) {
      rightDecay.current = clamped
    } else {
      rightDecay.current = Math.max(rightDecay.current - 0.02, clamped)
    }
    setLeftPeak(leftDecay.current)
    setRightPeak(rightDecay.current)
  }, [clamped])

  const dbLabel = clamped < 0.01 ? '-∞' : `${Math.round(20 * Math.log10(clamped))}`

  const barColor = (value: number) => {
    if (value < 0.5) return 'bg-green-500'
    if (value < 0.8) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const segmentWidth = (index: number, total: number) => {
    const pos = index / total
    if (pos < 0.5) return pos / 0.5
    return 1
  }

  const SEGMENTS = 24

  const renderBar = (value: number, peak: number) => (
    <div className="flex items-center gap-2">
      <div className="flex h-4 flex-1 gap-[2px] overflow-hidden rounded-sm bg-white/5">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const threshold = (i + 1) / SEGMENTS
          const isActive = value >= threshold
          const brightness = segmentWidth(i, SEGMENTS)
          return (
            <div
              key={i}
              className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                isActive ? barColor(threshold) : 'bg-white/5'
              }`}
              style={{ opacity: isActive ? 0.5 + brightness * 0.5 : 1 }}
            />
          )
        })}
      </div>
      <div className="relative flex h-4 w-4 items-center justify-center">
        <div
          className={`h-2 w-2 rounded-full transition-all duration-75 ${
            peak > 0 ? barColor(peak) : 'bg-white/10'
          }`}
          style={{
            boxShadow: peak > 0.8 ? `0 0 6px ${peak > 0.8 ? '#ef4444' : peak > 0.5 ? '#eab308' : '#22c55e'}` : 'none',
          }}
        />
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          VU Meter
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground/80">
          {dbLabel} dB
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {renderBar(clamped, leftPeak)}
        {renderBar(clamped, rightPeak)}
      </div>
      <div className="mt-1 flex justify-between px-[2px]">
        <span className="text-[9px] text-muted-foreground/40">-20</span>
        <span className="text-[9px] text-muted-foreground/40">-12</span>
        <span className="text-[9px] text-muted-foreground/40">-6</span>
        <span className="text-[9px] text-muted-foreground/40">0</span>
      </div>
    </div>
  )
}

export default VolumeMeter
