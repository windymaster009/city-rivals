import './dice-roll.css'
import DiceBox, { type DiceRollResult } from '@3d-dice/dice-box-threejs'

interface TwoDiceValues {
  dieOne: number
  dieTwo: number
  total: number
}

const rollButton = document.querySelector<HTMLButtonElement>('#roll-button')
const gameRoot = document.querySelector<HTMLElement>('#game-root')

if (rollButton && gameRoot) {
  const overlay = document.createElement('div')
  overlay.id = 'dice-physics-overlay'
  overlay.className = 'dice-physics-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  overlay.innerHTML = `
    <div id="dice-physics-stage" class="dice-physics-stage" aria-label="3D dice roll"></div>
    <div id="dice-physics-label" class="dice-physics-label">Rolling two dice…</div>
  `
  gameRoot.append(overlay)

  const resultLabel = overlay.querySelector<HTMLElement>('#dice-physics-label')
  const defaultButtonHtml = rollButton.innerHTML

  let diceBox: DiceBox | undefined
  let initializePromise: Promise<void> | undefined
  let replayingLegacyClick = false

  const delay = (milliseconds: number): Promise<void> => (
    new Promise((resolve) => window.setTimeout(resolve, milliseconds))
  )

  const nextPaint = (): Promise<void> => (
    new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
  )

  function showOverlay(): void {
    overlay.classList.remove('result')
    overlay.classList.add('visible')
    overlay.setAttribute('aria-hidden', 'false')
    if (resultLabel) resultLabel.textContent = 'Rolling two dice…'
  }

  function hideOverlay(): void {
    overlay.classList.remove('visible', 'result')
    overlay.setAttribute('aria-hidden', 'true')
  }

  async function ensureDiceBox(): Promise<DiceBox> {
    if (!diceBox) {
      diceBox = new DiceBox('#dice-physics-stage', {
        assetPath: '/',
        sounds: false,
        shadows: true,
        theme_surface: 'green-felt',
        theme_colorset: 'white',
        theme_texture: 'none',
        theme_material: 'plastic',
        gravity_multiplier: 360,
        light_intensity: 0.9,
        baseScale: 72,
        strength: 1.45,
        iterationLimit: 1200,
      })
    }

    if (!initializePromise) {
      initializePromise = (async () => {
        await nextPaint()
        await nextPaint()
        await diceBox?.initialize()
      })().catch((error: unknown) => {
        diceBox = undefined
        initializePromise = undefined
        throw error
      })
    }

    await initializePromise
    return diceBox
  }

  function readTwoDice(result: DiceRollResult): TwoDiceValues {
    const rolls = result.sets.flatMap((set) => set.rolls)
    const values = rolls
      .map((roll) => Number(roll.value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 6)

    if (values.length < 2) {
      throw new Error('The 3D dice roller did not return two valid d6 values')
    }

    const dieOne = values[0]
    const dieTwo = values[1]
    return { dieOne, dieTwo, total: dieOne + dieTwo }
  }

  async function rollPhysicalDice(): Promise<TwoDiceValues> {
    showOverlay()

    const box = await ensureDiceBox()
    box.clearDice()

    const result = await box.roll('2d6')
    const values = readTwoDice(result)

    overlay.classList.add('result')
    if (resultLabel) {
      resultLabel.textContent = `${values.dieOne} + ${values.dieTwo} = ${values.total}`
    }

    await delay(720)
    hideOverlay()
    window.setTimeout(() => box.clearDice(), 220)
    return values
  }

  function dieValueAsRandom(value: number): number {
    return (value - 0.5) / 6
  }

  /**
   * The current game already owns movement and turn switching. Its existing
   * roller samples Math.random 20 times and uses calls 19 and 20 as the final
   * two dice. Feed the physical results into those final two calls so this
   * feature branch stays isolated from the board-game logic.
   */
  function continueWithGameRoll(values?: TwoDiceValues): void {
    const originalRandom = Math.random
    let randomCallCount = 0
    let restored = false

    const restoreRandom = (): void => {
      if (restored) return
      restored = true
      if (Math.random === forcedRandom) Math.random = originalRandom
    }

    const forcedRandom = (): number => {
      randomCallCount += 1

      if (values && randomCallCount === 19) {
        return dieValueAsRandom(values.dieOne)
      }

      if (values && randomCallCount === 20) {
        const finalValue = dieValueAsRandom(values.dieTwo)
        queueMicrotask(restoreRandom)
        return finalValue
      }

      return originalRandom()
    }

    if (values) {
      Math.random = forcedRandom
      window.setTimeout(restoreRandom, 3000)
    }

    replayingLegacyClick = true
    rollButton.disabled = false
    rollButton.innerHTML = defaultButtonHtml
    rollButton.click()
    replayingLegacyClick = false
  }

  rollButton.addEventListener('click', async (event) => {
    if (replayingLegacyClick) return
    if (rollButton.disabled) return

    event.preventDefault()
    event.stopImmediatePropagation()

    rollButton.disabled = true
    rollButton.innerHTML = '<span>🎲</span> Rolling…'

    try {
      const values = await rollPhysicalDice()
      continueWithGameRoll(values)
    } catch (error) {
      console.warn('3D dice failed; using the original roll instead.', error)
      hideOverlay()
      continueWithGameRoll()
    }
  }, true)
}
