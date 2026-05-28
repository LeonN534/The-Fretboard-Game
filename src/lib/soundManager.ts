let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  startDelay = 0,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = c.currentTime + startDelay
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + duration)
}

export function playCountdownBeep() {
  beep(520, 0.12)
}

export function playGoBeep() {
  beep(880, 0.35, 'square')
}

export function playCorrect() {
  beep(523, 0.1, 'square')
  beep(784, 0.18, 'square', 0.1)
}

export function playWrong() {
  beep(140, 0.3, 'sawtooth')
}
