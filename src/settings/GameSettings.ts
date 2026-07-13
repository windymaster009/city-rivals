export type ResolutionOption = '1280 x 720' | '1920 x 1080' | '2560 x 1440' | '3840 x 2160'
export type FpsLimitOption = '30' | '60' | '120' | '144' | 'Unlimited'
export type ShadowQualityOption = 'Off' | 'Low' | 'Medium' | 'High' | 'Epic'
export type TextureQualityOption = 'Low' | 'Medium' | 'High' | 'Ultra'
export type KeyBindingPreset = 'Default' | 'Left Handed' | 'Custom'
export type GameLanguage = 'English' | 'Khmer' | 'French' | 'Japanese' | 'Spanish'

export interface GameSettingsSnapshot {
  fullscreen: boolean
  resolution: ResolutionOption
  vsync: boolean
  fpsLimit: FpsLimitOption
  shadowQuality: ShadowQualityOption
  textureQuality: TextureQualityOption
  mouseSensitivity: number
  invertMouse: boolean
  keyBindings: KeyBindingPreset
  customRollKey: string
  customCameraKey: string
  customNewMatchKey: string
  showCrosshair: boolean
  cameraDistance: number
  language: GameLanguage
}

export type GameSettingKey = keyof GameSettingsSnapshot
export type GameSettingsListener = (settings: Readonly<GameSettingsSnapshot>) => void

const STORAGE_KEY = 'city-rivals:game-settings'

export const DEFAULT_GAME_SETTINGS: Readonly<GameSettingsSnapshot> = {
  fullscreen: false,
  resolution: '1920 x 1080',
  vsync: true,
  fpsLimit: '60',
  shadowQuality: 'Low',
  textureQuality: 'Medium',
  mouseSensitivity: 42,
  invertMouse: false,
  keyBindings: 'Default',
  customRollKey: 'KeyR',
  customCameraKey: 'KeyC',
  customNewMatchKey: 'KeyN',
  showCrosshair: false,
  cameraDistance: 54,
  language: 'English',
}

const RESOLUTIONS: readonly ResolutionOption[] = ['1280 x 720', '1920 x 1080', '2560 x 1440', '3840 x 2160']
const FPS_LIMITS: readonly FpsLimitOption[] = ['30', '60', '120', '144', 'Unlimited']
const SHADOW_QUALITIES: readonly ShadowQualityOption[] = ['Off', 'Low', 'Medium', 'High', 'Epic']
const TEXTURE_QUALITIES: readonly TextureQualityOption[] = ['Low', 'Medium', 'High', 'Ultra']
const KEY_BINDING_PRESETS: readonly KeyBindingPreset[] = ['Default', 'Left Handed', 'Custom']
const LANGUAGES: readonly GameLanguage[] = ['English', 'Khmer', 'French', 'Japanese', 'Spanish']

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

function validKeyCode(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 && value.length <= 32 ? value : fallback
}

function normalizeSettings(value: Partial<GameSettingsSnapshot>): GameSettingsSnapshot {
  return {
    fullscreen: Boolean(value.fullscreen ?? DEFAULT_GAME_SETTINGS.fullscreen),
    resolution: includesValue(RESOLUTIONS, value.resolution) ? value.resolution : DEFAULT_GAME_SETTINGS.resolution,
    vsync: Boolean(value.vsync ?? DEFAULT_GAME_SETTINGS.vsync),
    fpsLimit: includesValue(FPS_LIMITS, value.fpsLimit) ? value.fpsLimit : DEFAULT_GAME_SETTINGS.fpsLimit,
    shadowQuality: includesValue(SHADOW_QUALITIES, value.shadowQuality)
      ? value.shadowQuality
      : DEFAULT_GAME_SETTINGS.shadowQuality,
    textureQuality: includesValue(TEXTURE_QUALITIES, value.textureQuality)
      ? value.textureQuality
      : DEFAULT_GAME_SETTINGS.textureQuality,
    mouseSensitivity: clamp(Number(value.mouseSensitivity ?? DEFAULT_GAME_SETTINGS.mouseSensitivity), 1, 100),
    invertMouse: Boolean(value.invertMouse ?? DEFAULT_GAME_SETTINGS.invertMouse),
    keyBindings: includesValue(KEY_BINDING_PRESETS, value.keyBindings)
      ? value.keyBindings
      : DEFAULT_GAME_SETTINGS.keyBindings,
    customRollKey: validKeyCode(value.customRollKey, DEFAULT_GAME_SETTINGS.customRollKey),
    customCameraKey: validKeyCode(value.customCameraKey, DEFAULT_GAME_SETTINGS.customCameraKey),
    customNewMatchKey: validKeyCode(value.customNewMatchKey, DEFAULT_GAME_SETTINGS.customNewMatchKey),
    showCrosshair: Boolean(value.showCrosshair ?? DEFAULT_GAME_SETTINGS.showCrosshair),
    cameraDistance: clamp(Number(value.cameraDistance ?? DEFAULT_GAME_SETTINGS.cameraDistance), 1, 100),
    language: includesValue(LANGUAGES, value.language) ? value.language : DEFAULT_GAME_SETTINGS.language,
  }
}

function readStoredSettings(): GameSettingsSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_GAME_SETTINGS }
    return normalizeSettings(JSON.parse(raw) as Partial<GameSettingsSnapshot>)
  } catch {
    return { ...DEFAULT_GAME_SETTINGS }
  }
}

class GameSettingsStore {
  private settings = readStoredSettings()
  private readonly listeners = new Set<GameSettingsListener>()

  get(): Readonly<GameSettingsSnapshot> {
    return this.settings
  }

  set<K extends GameSettingKey>(key: K, value: GameSettingsSnapshot[K]): void {
    this.update({ [key]: value } as Pick<GameSettingsSnapshot, K>)
  }

  update(patch: Partial<GameSettingsSnapshot>): void {
    const next = normalizeSettings({ ...this.settings, ...patch })
    this.settings = next

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // The game still works when browser storage is disabled.
    }

    this.listeners.forEach((listener) => listener(next))
  }

  reset(): void {
    this.settings = { ...DEFAULT_GAME_SETTINGS }
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore unavailable browser storage.
    }
    this.listeners.forEach((listener) => listener(this.settings))
  }

  subscribe(listener: GameSettingsListener, emitImmediately = true): () => void {
    this.listeners.add(listener)
    if (emitImmediately) listener(this.settings)
    return () => this.listeners.delete(listener)
  }
}

export const gameSettings = new GameSettingsStore()

export function parseResolution(value: ResolutionOption): { width: number; height: number } {
  const [width, height] = value.split(' x ').map(Number)
  return { width, height }
}

export function fpsLimitAsNumber(value: FpsLimitOption): number | undefined {
  return value === 'Unlimited' ? undefined : Number(value)
}

export function displayKeyCode(code: string): string {
  const replacements: Readonly<Record<string, string>> = {
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }

  if (replacements[code]) return replacements[code]
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  return code
}

export function languageCode(language: GameLanguage): string {
  const codes: Readonly<Record<GameLanguage, string>> = {
    English: 'en',
    Khmer: 'km',
    French: 'fr',
    Japanese: 'ja',
    Spanish: 'es',
  }
  return codes[language]
}
