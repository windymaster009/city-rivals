type WaveType = OscillatorType

interface StoredSoundSettings {
  master: number
  effects: number
  muted: boolean
}

export interface SoundSettingsSnapshot {
  master: number
  effects: number
  muted: boolean
}

const STORAGE_KEY = 'city-rivals:sound-settings'

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function readStoredSettings(): StoredSoundSettings {
  const fallback: StoredSoundSettings = {
    master: 0.85,
    effects: 0.8,
    muted: false,
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<StoredSoundSettings>
    return {
      master: clamp(Number(parsed.master ?? fallback.master)),
      effects: clamp(Number(parsed.effects ?? fallback.effects)),
      muted: Boolean(parsed.muted ?? fallback.muted),
    }
  } catch {
    return fallback
  }
}

export class SoundManager {
  private context?: AudioContext
  private masterGain?: GainNode
  private effectsGain?: GainNode
  private settings = readStoredSettings()
  private uiSoundsEnabled = false
  private physicalDiceSequencePending = false

  enableUiSounds(root: Document | HTMLElement = document): void {
    if (this.uiSoundsEnabled) return
    this.uiSoundsEnabled = true

    const unlock = (): void => {
      void this.unlock()
    }

    root.addEventListener('pointerdown', unlock, { once: true, capture: true })
    root.addEventListener('keydown', unlock, { once: true, capture: true })

    root.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : undefined
      const interactive = target?.closest<HTMLElement>('button, a, [role="button"]')
      if (!interactive) return
      if (interactive.matches(':disabled') || interactive.dataset.sound === 'none') return
      this.uiClick()
    }, true)
  }

  getSettings(): SoundSettingsSnapshot {
    return {
      master: Math.round(this.settings.master * 100),
      effects: Math.round(this.settings.effects * 100),
      muted: this.settings.muted,
    }
  }

  setMasterVolume(value: number): void {
    this.settings.master = clamp(value / 100)
    this.applyVolume()
    this.persist()
  }

  setEffectsVolume(value: number): void {
    this.settings.effects = clamp(value / 100)
    this.applyVolume()
    this.persist()
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted
    this.applyVolume()
    this.persist()
  }

  markPhysicalDiceSequence(): void {
    this.physicalDiceSequencePending = true
  }

  cancelPhysicalDiceSequence(): void {
    this.physicalDiceSequencePending = false
  }

  consumePhysicalDiceSequence(): boolean {
    const pending = this.physicalDiceSequencePending
    this.physicalDiceSequencePending = false
    return pending
  }

  async unlock(): Promise<void> {
    const context = this.ensureContext()
    if (!context) return
    if (context.state === 'suspended') await context.resume()
  }

  uiClick(): void {
    this.tone(520, 0.045, 'triangle', 0.08, 0, 680)
  }

  turnStart(): void {
    this.tone(440, 0.08, 'sine', 0.11)
    this.tone(660, 0.12, 'triangle', 0.1, 0.085)
  }

  gameStart(): void {
    this.tone(330, 0.11, 'triangle', 0.1)
    this.tone(494, 0.11, 'triangle', 0.1, 0.1)
    this.tone(659, 0.2, 'sine', 0.12, 0.2)
  }

  diceStart(): void {
    for (let index = 0; index < 7; index += 1) {
      const delay = index * 0.07
      const frequency = 160 + Math.random() * 150
      this.tone(frequency, 0.045, 'square', 0.055, delay, frequency * 0.72)
      this.noise(0.035, 0.035, delay)
    }
  }

  diceTick(): void {
    const frequency = 180 + Math.random() * 120
    this.tone(frequency, 0.035, 'square', 0.045, 0, frequency * 0.8)
  }

  diceResult(total: number): void {
    const base = 360 + total * 18
    this.tone(base, 0.09, 'triangle', 0.11)
    this.tone(base * 1.25, 0.14, 'sine', 0.1, 0.09)
  }

  jump(): void {
    this.tone(230, 0.11, 'sine', 0.06, 0, 420)
  }

  land(): void {
    this.tone(120, 0.08, 'triangle', 0.08, 0, 78)
    this.noise(0.055, 0.04)
  }

  lap(): void {
    this.tone(392, 0.1, 'triangle', 0.1)
    this.tone(523, 0.1, 'triangle', 0.1, 0.1)
    this.tone(784, 0.18, 'sine', 0.12, 0.2)
  }

  eliminated(): void {
    this.tone(330, 0.15, 'sawtooth', 0.09, 0, 260)
    this.tone(220, 0.18, 'sawtooth', 0.09, 0.14, 145)
    this.tone(110, 0.3, 'sine', 0.1, 0.3, 70)
  }

  victory(): void {
    const notes = [392, 494, 587, 784]
    notes.forEach((note, index) => {
      this.tone(note, index === notes.length - 1 ? 0.42 : 0.13, 'triangle', 0.11, index * 0.12)
    })
  }

  test(): void {
    this.turnStart()
    window.setTimeout(() => this.diceResult(7), 180)
  }

  private ensureContext(): AudioContext | undefined {
    if (this.settings.muted || this.settings.master <= 0 || this.settings.effects <= 0) return undefined

    if (!this.context) {
      this.context = new AudioContext()
      this.masterGain = this.context.createGain()
      this.effectsGain = this.context.createGain()
      this.effectsGain.connect(this.masterGain)
      this.masterGain.connect(this.context.destination)
      this.applyVolume()
    }

    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private applyVolume(): void {
    if (!this.masterGain || !this.effectsGain) return
    const now = this.context?.currentTime ?? 0
    const masterValue = this.settings.muted ? 0 : this.settings.master
    this.masterGain.gain.setTargetAtTime(masterValue, now, 0.015)
    this.effectsGain.gain.setTargetAtTime(this.settings.effects, now, 0.015)
  }

  private tone(
    frequency: number,
    duration: number,
    type: WaveType,
    volume: number,
    delay = 0,
    endFrequency?: number,
  ): void {
    const context = this.ensureContext()
    if (!context || !this.effectsGain) return

    const startsAt = context.currentTime + delay
    const endsAt = startsAt + duration
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(30, frequency), startsAt)
    if (endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), endsAt)
    }

    gain.gain.setValueAtTime(0.0001, startsAt)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startsAt + Math.min(0.018, duration * 0.35))
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt)

    oscillator.connect(gain)
    gain.connect(this.effectsGain)
    oscillator.start(startsAt)
    oscillator.stop(endsAt + 0.02)
  }

  private noise(duration: number, volume: number, delay = 0): void {
    const context = this.ensureContext()
    if (!context || !this.effectsGain) return

    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    const startsAt = context.currentTime + delay
    const endsAt = startsAt + duration

    filter.type = 'lowpass'
    filter.frequency.value = 900
    gain.gain.setValueAtTime(Math.max(0.0001, volume), startsAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt)

    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.effectsGain)
    source.start(startsAt)
    source.stop(endsAt + 0.01)
  }

  private persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    } catch {
      // Local storage can be unavailable in private or restricted browser modes.
    }
  }
}

export const soundManager = new SoundManager()
