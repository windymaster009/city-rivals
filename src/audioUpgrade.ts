import '../styles/audio.css'
import { soundManager } from './audio/SoundManager'

soundManager.enableUiSounds()

const rollButton = document.querySelector<HTMLButtonElement>('#roll-button')
const diceTotal = document.querySelector<HTMLElement>('#dice-total')
const turnLabel = document.querySelector<HTMLElement>('#turn-label')
const eventLog = document.querySelector<HTMLElement>('#event-log')
const setupScreen = document.querySelector<HTMLElement>('#setup-screen')

let diceSequenceActive = false
let diceMutationCount = 0
let movementTimers: number[] = []
let previousTurnLabel = turnLabel?.textContent ?? ''
let previousLogEntry = ''
let setupWasHidden = setupScreen?.classList.contains('hidden') ?? true

function clearMovementSounds(): void {
  movementTimers.forEach((timer) => window.clearTimeout(timer))
  movementTimers = []
}

function scheduleMovementSounds(steps: number): void {
  clearMovementSounds()

  for (let step = 0; step < steps; step += 1) {
    const jumpAt = step * 360
    const landAt = jumpAt + 300

    movementTimers.push(window.setTimeout(() => soundManager.jump(), jumpAt))
    movementTimers.push(window.setTimeout(() => soundManager.land(), landAt))
  }
}

rollButton?.addEventListener('click', () => {
  if (rollButton.disabled) return

  // diceUpgrade.ts replays the click after the physical dice finish. Keep one
  // audio sequence alive so that replay does not start the roll sound twice.
  if (!diceSequenceActive) {
    diceSequenceActive = true
    diceMutationCount = 0
    clearMovementSounds()
    soundManager.diceStart()
  }
}, true)

if (diceTotal) {
  const diceObserver = new MutationObserver(() => {
    if (!diceSequenceActive) return

    const total = Number(diceTotal.textContent)
    if (!Number.isInteger(total) || total < 2 || total > 12) return

    diceMutationCount += 1

    if (diceMutationCount < 10) {
      soundManager.diceTick()
      return
    }

    soundManager.diceResult(total)
    scheduleMovementSounds(total)
    diceSequenceActive = false
    diceMutationCount = 0
  })

  diceObserver.observe(diceTotal, { childList: true, characterData: true, subtree: true })
}

if (turnLabel) {
  const turnObserver = new MutationObserver(() => {
    const nextLabel = turnLabel.textContent?.trim() ?? ''
    if (!nextLabel || nextLabel === previousTurnLabel) return
    previousTurnLabel = nextLabel

    if (nextLabel.endsWith("'s turn")) {
      soundManager.turnStart()
    } else if (nextLabel.includes('survives!')) {
      clearMovementSounds()
      soundManager.victory()
    } else if (nextLabel === 'No survivors') {
      clearMovementSounds()
      soundManager.eliminated()
    }
  })

  turnObserver.observe(turnLabel, { childList: true, characterData: true, subtree: true })
}

if (eventLog) {
  const logObserver = new MutationObserver(() => {
    const newestEntry = eventLog.firstElementChild?.textContent?.trim() ?? ''
    if (!newestEntry || newestEntry === previousLogEntry) return
    previousLogEntry = newestEntry

    if (newestEntry.includes('completed lap')) {
      soundManager.lap()
    } else if (newestEntry.includes('is eliminated')) {
      soundManager.eliminated()
    }
  })

  logObserver.observe(eventLog, { childList: true, subtree: true })
}

if (setupScreen) {
  const setupObserver = new MutationObserver(() => {
    const isHidden = setupScreen.classList.contains('hidden')

    if (!setupWasHidden && isHidden && turnLabel?.textContent?.includes("'s turn")) {
      soundManager.gameStart()
    }

    setupWasHidden = isHidden
  })

  setupObserver.observe(setupScreen, { attributes: true, attributeFilter: ['class'] })
}

window.addEventListener('beforeunload', clearMovementSounds)
