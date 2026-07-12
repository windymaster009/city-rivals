import './style.css'
import * as THREE from 'three'
import { createBoard, setBoardTileGlow, type BoardTile } from './game/board'
import {
  animateCharacterIdle,
  animateJumpPose,
  createCharacter,
  pickUniqueCharacterModels,
} from './game/Character'
import { CameraController } from './game/CameraController'
import type { PlayerState } from './game/types'

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing required UI element: ${selector}`)
  return element
}

const canvas = requireElement<HTMLCanvasElement>('#game-canvas')
const rollButton = requireElement<HTMLButtonElement>('#roll-button')
const cameraButton = requireElement<HTMLButtonElement>('#camera-button')
const newMatchButton = requireElement<HTMLButtonElement>('#new-match-button')
const diceOneValue = requireElement<HTMLElement>('#dice-one')
const diceTwoValue = requireElement<HTMLElement>('#dice-two')
const diceTotalValue = requireElement<HTMLElement>('#dice-total')
const playerStatus = requireElement<HTMLElement>('#player-status')
const turnLabel = requireElement<HTMLElement>('#turn-label')
const eventLog = requireElement<HTMLElement>('#event-log')
const inventoryOwner = requireElement<HTMLElement>('#inventory-owner')
const inventoryItems = requireElement<HTMLElement>('#inventory-items')
const loading = requireElement<HTMLElement>('#loading')
const setupScreen = requireElement<HTMLElement>('#setup-screen')
const setupForm = requireElement<HTMLFormElement>('#setup-form')
const playerCountSelect = requireElement<HTMLSelectElement>('#player-count')
const startingMoneyInput = requireElement<HTMLInputElement>('#starting-money')
const playerNameFields = requireElement<HTMLElement>('#player-name-fields')

const PLAYER_COLORS = [
  0x22d3ee,
  0xf472b6,
  0xfbbf24,
  0x34d399,
  0xa78bfa,
  0xfb7185,
]

const DEFAULT_NAMES = ['Windy', 'Rival', 'Player 3', 'Player 4', 'Player 5', 'Player 6']
const moneyFormatter = new Intl.NumberFormat('en-US')

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x070b16)
scene.fog = new THREE.Fog(0x070b16, 30, 62)

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

const ambient = new THREE.HemisphereLight(0x91b8ff, 0x111827, 1.55)
scene.add(ambient)

const sun = new THREE.DirectionalLight(0xffffff, 3.2)
sun.position.set(9, 20, 11)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -20
sun.shadow.camera.right = 20
sun.shadow.camera.top = 22
sun.shadow.camera.bottom = -22
scene.add(sun)

const centerLight = new THREE.PointLight(0xfbbf24, 15, 20, 2)
centerLight.position.set(0, 5.5, 0)
scene.add(centerLight)

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(34, 64),
  new THREE.MeshStandardMaterial({ color: 0x050914, roughness: 1 }),
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.86
ground.receiveShadow = true
scene.add(ground)

const { tiles, startTile } = createBoard(scene)
const cameraController = new CameraController(camera)

let players: PlayerState[] = []
let activePlayerIndex = 0
let moving = false
let boardViewOverride = false
let gameStarted = false
let gameOver = false
let logEntries: string[] = []
const clock = new THREE.Clock()

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function activePlayer(): PlayerState {
  const player = players[activePlayerIndex]
  if (!player) throw new Error('No active player is available')
  return player
}

function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`
}

function formatMoney(value: number): string {
  return `$${moneyFormatter.format(value)}`
}

function tileLabel(player: PlayerState): string {
  return player.tileIndex < 0 ? 'START' : String(player.tileIndex + 1)
}

function totalInventoryItems(player: PlayerState): number {
  return player.inventory.reduce((total, item) => total + item.quantity, 0)
}

function playerOffset(player: PlayerState): THREE.Vector3 {
  const playerCount = Math.max(players.length, 2)
  const radius = playerCount <= 2 ? 0.3 : playerCount <= 4 ? 0.4 : 0.48
  const angle = (-Math.PI / 2) + ((player.seatIndex / playerCount) * Math.PI * 2)
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
}

function positionPlayerAtStart(player: PlayerState): void {
  const position = startTile.position.clone().add(playerOffset(player))
  player.model.position.copy(position)
}

function updateBoardTileGlows(elapsed: number): void {
  const boardTargets = [startTile, ...tiles]
  const active = gameStarted && !gameOver ? players[activePlayerIndex] : undefined
  const pulse = active ? (Math.sin(elapsed * 4.2) + 1) * 0.5 : 0

  for (const tile of boardTargets) {
    const occupants = gameStarted
      ? players.filter((player) => !player.eliminated && player.tileIndex === tile.index)
      : []

    const activeOccupant = active && !active.eliminated && active.tileIndex === tile.index
      ? active
      : undefined

    setBoardTileGlow(
      tile,
      occupants.map((player) => player.accent),
      activeOccupant?.accent,
      activeOccupant ? pulse : 0,
    )
  }
}

function disposePlayerModel(player: PlayerState): void {
  scene.remove(player.model)
  player.model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

function addLog(message: string): void {
  logEntries = [escapeHtml(message), ...logEntries].slice(0, 7)
  eventLog.innerHTML = logEntries.map((entry) => `<div class="log-entry">${entry}</div>`).join('')
}

function updatePrivateInventory(): void {
  if (!gameStarted || players.length === 0) {
    inventoryOwner.textContent = 'Waiting for a match'
    inventoryItems.innerHTML = '<div class="inventory-empty">Start a match to view the active player’s items.</div>'
    return
  }

  const player = activePlayer()
  inventoryOwner.textContent = `${player.name}'s items`

  if (player.inventory.length === 0) {
    inventoryItems.innerHTML = `
      <div class="inventory-empty">No items yet. The real tile rewards will be mapped next.</div>
      <div class="inventory-slots" aria-label="Empty inventory slots">
        ${Array.from({ length: 6 }, () => '<span></span>').join('')}
      </div>
    `
    return
  }

  inventoryItems.innerHTML = player.inventory.map((item) => `
    <div class="inventory-item">
      <strong>${escapeHtml(item.name)}</strong>
      <span>×${item.quantity}</span>
    </div>
  `).join('')
}

function updateHud(): void {
  if (players.length === 0) {
    playerStatus.innerHTML = '<div class="hud-placeholder">Choose 2–6 players to begin</div>'
    turnLabel.textContent = 'Set up a match'
    updatePrivateInventory()
    return
  }

  playerStatus.innerHTML = players.map((player, index) => {
    const isActive = gameStarted && index === activePlayerIndex && !gameOver && !player.eliminated
    const healthPercent = (player.hearts / player.maxHearts) * 100
    return `
      <article class="player-card ${isActive ? 'active' : ''} ${player.eliminated ? 'dead' : ''}" style="--accent:${hexColor(player.accent)}">
        <div class="avatar">${escapeHtml(player.name.slice(0, 1).toUpperCase())}</div>
        <div class="player-copy">
          <div class="name-line">
            <strong>${escapeHtml(player.name)}</strong>
            ${isActive ? '<span>TURN</span>' : ''}
            ${player.eliminated ? '<span class="dead-tag">OUT</span>' : ''}
          </div>
          <div class="health-track"><span style="width:${healthPercent}%"></span></div>
          <div class="stats">
            <span>❤️ ${player.hearts}/${player.maxHearts}</span>
            <span>💵 ${formatMoney(player.money)}</span>
            <span>📍 ${tileLabel(player)}</span>
            <span>🎒 ${totalInventoryItems(player)}</span>
          </div>
        </div>
      </article>
    `
  }).join('')

  if (!gameOver && gameStarted) turnLabel.textContent = `${activePlayer().name}'s turn`
  updatePrivateInventory()
}

function resetDiceDisplay(): void {
  diceOneValue.textContent = '–'
  diceTwoValue.textContent = '–'
  diceTotalValue.textContent = '–'
}

function setActiveCamera(): void {
  if (!gameStarted || players.length === 0) return
  boardViewOverride = false
  cameraController.focusOn(activePlayer().model.position)
  cameraButton.textContent = 'Board View'
}

function startTurn(): void {
  if (!gameStarted || gameOver) return
  updateHud()
  setActiveCamera()
  rollButton.disabled = false
  resetDiceDisplay()
  addLog(`⚡ ${activePlayer().name}'s turn started`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

async function jumpToTile(player: PlayerState, destinationTile: BoardTile): Promise<void> {
  const start = player.model.position.clone()
  const destination = destinationTile.position.clone().add(playerOffset(player))
  const direction = destination.clone().sub(start)
  direction.y = 0

  cameraController.updateDirection(direction)
  cameraController.follow(player.model, direction)

  if (direction.lengthSq() > 0.01) {
    player.model.rotation.y = Math.atan2(direction.x, direction.z)
  }

  await new Promise<void>((resolve) => {
    const duration = 315
    const startedAt = performance.now()

    const animateStep = (now: number): void => {
      const raw = Math.min((now - startedAt) / duration, 1)
      const progress = easeInOutCubic(raw)
      player.model.position.lerpVectors(start, destination, progress)
      player.model.position.y = Math.sin(raw * Math.PI) * 1.05
      animateJumpPose(player.model, raw)

      const shadow = player.model.userData.shadow as THREE.Mesh
      const scale = 1 - Math.sin(raw * Math.PI) * 0.35
      shadow.scale.setScalar(scale)

      if (raw < 1) {
        requestAnimationFrame(animateStep)
      } else {
        player.model.position.copy(destination)
        shadow.scale.setScalar(1)
        resolve()
      }
    }

    requestAnimationFrame(animateStep)
  })
}

function synchronizeLifeState(player: PlayerState): void {
  player.hearts = Math.max(0, Math.min(player.maxHearts, player.hearts))
  if (player.hearts > 0 || player.eliminated) return

  player.eliminated = true
  player.model.visible = false
  addLog(`💀 ${player.name} has no hearts left and is eliminated`)
}

function finishGame(winner?: PlayerState): void {
  gameOver = true
  moving = false
  rollButton.disabled = true

  if (winner) {
    turnLabel.textContent = `${winner.name} survives!`
    cameraController.focusOn(winner.model.position)
    addLog(`🏆 ${winner.name} is the last surviving player`)
  } else {
    turnLabel.textContent = 'No survivors'
    cameraController.setBoardView()
    addLog('💀 Every player was eliminated')
  }

  updateHud()
}

function checkForWinner(): boolean {
  const survivors = players.filter((player) => !player.eliminated)
  if (survivors.length > 1) return false
  finishGame(survivors[0])
  return true
}

function resolvePlaceholderTile(player: PlayerState): void {
  if (player.tileIndex < 0) return

  const tile = tiles[player.tileIndex]
  addLog(`📍 ${player.name} landed on ${tile.name} — rule not mapped yet`)
  synchronizeLifeState(player)
  checkForWinner()
}

function advanceToNextLivingPlayer(): void {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidateIndex = (activePlayerIndex + offset) % players.length
    if (!players[candidateIndex].eliminated) {
      activePlayerIndex = candidateIndex
      return
    }
  }
}

async function rollTwoDice(): Promise<void> {
  if (!gameStarted || moving || gameOver) return
  moving = true
  rollButton.disabled = true
  newMatchButton.disabled = true

  const player = activePlayer()
  let dieOne = 1
  let dieTwo = 1

  for (let index = 0; index < 10; index += 1) {
    dieOne = Math.floor(Math.random() * 6) + 1
    dieTwo = Math.floor(Math.random() * 6) + 1
    diceOneValue.textContent = String(dieOne)
    diceTwoValue.textContent = String(dieTwo)
    diceTotalValue.textContent = String(dieOne + dieTwo)
    await delay(48 + index * 5)
  }

  const total = dieOne + dieTwo
  addLog(`🎲 ${player.name} rolled ${dieOne} + ${dieTwo} = ${total}`)

  for (let step = 0; step < total; step += 1) {
    const previousIndex = player.tileIndex
    player.tileIndex = previousIndex < 0
      ? 0
      : (previousIndex + 1) % tiles.length

    if (previousIndex === tiles.length - 1 && player.tileIndex === 0) {
      player.laps += 1
      addLog(`🔁 ${player.name} completed lap ${player.laps}`)
    }

    await jumpToTile(player, tiles[player.tileIndex])
    await delay(45)
  }

  cameraController.focusOn(player.model.position)
  resolvePlaceholderTile(player)
  updateHud()

  if (gameOver) {
    newMatchButton.disabled = false
    return
  }

  await delay(850)
  advanceToNextLivingPlayer()
  moving = false
  newMatchButton.disabled = false
  startTurn()
}

function renderPlayerNameFields(): void {
  const previousNames = Array.from(
    playerNameFields.querySelectorAll<HTMLInputElement>('.player-name-input'),
  ).map((input) => input.value)
  const count = Math.max(2, Math.min(6, Number(playerCountSelect.value)))

  playerNameFields.replaceChildren()
  for (let index = 0; index < count; index += 1) {
    const label = document.createElement('label')
    label.className = 'player-name-field'

    const caption = document.createElement('span')
    caption.textContent = `Player ${index + 1}`

    const input = document.createElement('input')
    input.className = 'player-name-input'
    input.type = 'text'
    input.maxLength = 18
    input.required = true
    input.value = previousNames[index] ?? DEFAULT_NAMES[index]

    label.append(caption, input)
    playerNameFields.append(label)
  }
}

async function startNewGame(names: string[], startingMoney: number): Promise<void> {
  players.forEach(disposePlayerModel)
  players = []

  const characterAssignments = pickUniqueCharacterModels(names.length)

  players = await Promise.all(
    names.map(async (name, seatIndex) => {
      const accent = PLAYER_COLORS[seatIndex]
      const character = characterAssignments[seatIndex]
      const model = await createCharacter(accent, character)
      model.scale.setScalar(0.7)

      return {
        id: `player-${seatIndex + 1}`,
        seatIndex,
        name,
        hearts: 5,
        maxHearts: 5,
        money: startingMoney,
        inventory: [],
        tileIndex: -1,
        laps: 0,
        accent,
        model,
        eliminated: false,
      }
    }),
  )

  players.forEach((player) => {
    positionPlayerAtStart(player)
    scene.add(player.model)
  })

  activePlayerIndex = 0
  moving = false
  boardViewOverride = false
  gameStarted = true
  gameOver = false
  logEntries = []
  eventLog.replaceChildren()
  setupScreen.classList.add('hidden')
  newMatchButton.disabled = false

  addLog(`🇰🇭 Match started with ${players.length} players`)
  addLog(`❤️ Everyone begins with 5 hearts and ${formatMoney(startingMoney)}`)
  players.forEach((player) => {
    const characterName = String(player.model.userData.characterName ?? 'Character')
    addLog(`🧍 ${player.name} received ${characterName}`)
  })
  addLog('🏁 START is outside the grid; Tile 63 loops directly to Tile 1')
  addLog('🧩 All 63 special tiles are placeholders for now')
  startTurn()
}

function showSetup(): void {
  if (moving) return
  gameStarted = false
  rollButton.disabled = true
  resetDiceDisplay()
  cameraController.setBoardView()
  setupScreen.classList.remove('hidden')
  turnLabel.textContent = 'Set up a match'
  updatePrivateInventory()
}

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const submitButton = setupForm.querySelector<HTMLButtonElement>('button[type="submit"]')
  const names = Array.from(
    playerNameFields.querySelectorAll<HTMLInputElement>('.player-name-input'),
  ).map((input, index) => input.value.trim() || DEFAULT_NAMES[index])

  const startingMoney = Math.max(0, Math.floor(Number(startingMoneyInput.value) || 1000))
  startingMoneyInput.value = String(startingMoney)

  try {
    if (submitButton) {
      submitButton.disabled = true
      submitButton.textContent = 'Loading random characters…'
    }

    await startNewGame(names, startingMoney)
  } catch (error) {
    console.error('Failed to start match:', error)
    window.alert('The match could not start. Check the browser console for details.')
  } finally {
    if (submitButton) {
      submitButton.disabled = false
      submitButton.textContent = 'Start Match'
    }
  }
})

playerCountSelect.addEventListener('change', renderPlayerNameFields)

rollButton.addEventListener('click', () => {
  void rollTwoDice()
})

cameraButton.addEventListener('click', () => {
  if (!gameStarted || players.length === 0) return

  boardViewOverride = !boardViewOverride
  if (boardViewOverride) {
    cameraController.setBoardView()
    cameraButton.textContent = 'Follow Player'
  } else {
    cameraController.focusOn(activePlayer().model.position)
    cameraButton.textContent = 'Board View'
  }
})

newMatchButton.addEventListener('click', showSetup)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

function render(): void {
  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime

  players.forEach((player, index) => {
    if (!player.eliminated && (!moving || player !== players[activePlayerIndex])) {
      const isActive = gameStarted && index === activePlayerIndex && !gameOver
      animateCharacterIdle(player.model, elapsed + index * 0.8, isActive)
    }
  })

  updateBoardTileGlows(elapsed)
  cameraController.update(delta)
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

renderPlayerNameFields()
updateHud()
resetDiceDisplay()
cameraController.setBoardView()
loading.classList.add('hidden')
render()
