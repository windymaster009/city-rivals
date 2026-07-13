declare module '@3d-dice/dice-box-threejs' {
  export interface DiceRollValue {
    value: number
    reason?: string
  }

  export interface DiceRollEntry extends DiceRollValue {
    id: number
    type: string
    sides: number
  }

  export interface DiceRollSet {
    num: number
    type: string
    sides: number
    rolls: DiceRollEntry[]
    total: number
  }

  export interface DiceRollResult {
    sets: DiceRollSet[]
    modifier: number
    total: number
  }

  export interface DiceBoxOptions {
    assetPath?: string
    sounds?: boolean
    volume?: number
    shadows?: boolean
    theme_surface?: string
    theme_colorset?: string
    theme_texture?: string
    theme_material?: 'none' | 'metal' | 'wood' | 'glass' | 'plastic'
    gravity_multiplier?: number
    light_intensity?: number
    baseScale?: number
    strength?: number
    iterationLimit?: number
    onRollComplete?: (result: DiceRollResult) => void
    [key: string]: unknown
  }

  export default class DiceBox {
    constructor(containerSelector: string, options?: DiceBoxOptions)
    initialize(): Promise<void>
    roll(notation: string): Promise<DiceRollResult>
    clearDice(): void
  }
}
