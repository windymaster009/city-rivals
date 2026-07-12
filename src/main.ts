import './style.css'
import * as THREE from 'three'
import { createBoard, type BoardTile } from './game/board'
import { animateCharacterIdle, animateJumpPose, createCharacter } from './game/Character'
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
const diceOneValue = requireElement<HTMLElement>('#dice-one')
const diceTwoValue = requireElement<HTMLElement>('#dice-two')
const diceTotalValue = requireElement<HTMLElement>('#dice-total')
const playerStatus = requireElement<HTMLElement>('#player-status')
const turnLabel = requireElement<HTMLElement>('#turn-label')
const eventLog = requireElement<HTMLElement>('#event-log')
const loading = requireElement<HTMLElement>('#loading')

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x070b16)
scene.fog = new THREE.Fog(0x070b16, 25, 48)

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.12

const ambient = new THREE.HemisphereLight(0x91b8ff, 0x111827, 1.45)
scene.add(ambient)

const sun = new THREE.DirectionalLight(0xffffff, 3.4)
sun.position.set(10, 18, 8)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -20
sun.shadow.camera.right = 20
sun.shadow.camera.top = 20
sun.shadow.camera.bottom = -20
scene.add(sun)

const centerLight = new THREE.PointLight(0xfbbf24, 18, 18, 2)
centerLight.position.set(0, 4.5, 0)
scene.add(centerLight)

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(32, 64),
  new THREE.MeshStandardMaterial({ color: 0x050914, roughness: 1 }),
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.9
ground.receiveShadow = true
scene.add(ground)

const tiles = createBoard(scene)
const cameraController = new CameraController(camera)

const players: PlayerState[] = [
  {
    id: 'windy',
    name: 'Windy',
    health: 100,
    tileIndex: 0,
    laps: 0,
    accent: 0x22d3ee,
    model: createCharacter(0x22d3ee),
  },
  {
    id: 'rival',
    name: 'Rival',
    health: 100,
    tileIndex: 0,
    laps: 0,
    accent: 0xf472b6,
    model: createCharacter(0xf472b6),
  },
]

function positionPlayerOnTile(player: PlayerState, tile: BoardTile): void {
  const position = tile.position.clone()
  const offset = player.id === 'windy' ? -0.28 : 0.28
  position.x += offset
  position.z -= offset
  player.model.position.copy(position)
}

players.forEach((player) => {
  positionPlayerOnTile(player, tiles[0])
  scene.add(player.model)
})

let activePlayerIndex = 0
let moving = false
let boardViewOverride = false
let gameOver = false
let logEntries: string[] = []
const clock = new THREE.Clock()

function activePlayer(): PlayerState {
  return players[activePlayerIndex]
}

function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`
}

function tileLabel(player: PlayerState): string {
  return player.tileIndex === 0 ? 'START' : String(player.tileIndex)
}

function addLog(message: string): void {
  logEntries = [message, ...logEntries].slice(0, 6)
  eventLog.innerHTML = logEntries.map((entry) => `<div class="log-entry">${entry}</div>`).join('')
}

function updateHud(): void {
  playerStatus.innerHTML = players.map((player, index) => {
    const isActive = index === activePlayerIndex && !gameOver
    const healthPercent = Math.max(0, Math.min(100, player.health))
    return `
      <article class="player-card ${isActive ? 'active' : ''} ${player.health <= 0 ? 'dead' : ''}" style="--accent:${hexColor(player.accent)}">
        <div class="avatar">${player.name.slice(0, 1)}</div>
        <div class="player-copy">
          <div class="name-line"><strong>${player.name}</strong>${isActive ? '<span>TURN</span>' : ''}${player.health <= 0 ? '<span class="dead-tag">DEAD</span>' : ''}</div>
          <div class="health-track"><span style="width:${healthPercent}%"></span></div>
          <div class="stats"><span>❤️ ${player.health}</span><span>📍 ${tileLabel(player)}</span><span>🔁 ${player.laps}</span></div>
        </div>
      </article>
    `
  }).join('')

  if (!gameOver) turnLabel.textContent = `${activePlayer().name}'s turn`
}

function setActiveCamera(): void {
  boardViewOverride = false
  cameraController.focusOn(activePlayer().model.position)
  cameraButton.textContent = 'Board View'
}

function resetDiceDisplay(): void {
  diceOneValue.textContent = '–'
  diceTwoValue.textContent = '–'
  diceTotalValue.textContent = '–'
}

function startTurn(): void {
  if (gameOver) return
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
  const destination = destinationTile.position.clone()
  const playerOffset = player.id === 'windy' ? -0.28 : 0.28
  destination.x += playerOffset
  destination.z -= playerOffset

  const direction = destination.clone().sub(start)
  direction.y = 0
  cameraController.updateDirection(direction)
  cameraController.follow(player.model, direction)

  if (direction.lengthSq() > 0.01) {
    player.model.rotation.y = Math.atan2(direction.x, direction.z)
  }

  await new Promise<void>((resolve) => {
    const duration = 390
    const startedAt = performance.now()

    const animateStep = (now: number): void => {
      const raw = Math.min((now - startedAt) / duration, 1)
      const progress = easeInOutCubic(raw)
      player.model.position.lerpVectors(start, destination, progress)
      player.model.position.y = Math.sin(raw * Math.PI) * 1.25
      animateJumpPose(player.model, raw)

      const shadow = player.model.userData.shadow as THREE.Mesh
      const scale = 1 - Math.sin(raw * Math.PI) * 0.35
      shadow.scale.setScalar(scale)

      if (raw < 1) requestAnimationFrame(animateStep)
      else {
        player.model.position.copy(destination)
        shadow.scale.setScalar(1)
        resolve()
      }
    }

    requestAnimationFrame(animateStep)
  })
}

function finishGame(winner: PlayerState, defeated: PlayerState): void {
  gameOver = true
  moving = false
  rollButton.disabled = true
  turnLabel.textContent = `${winner.name} wins!`
  cameraController.focusOn(winner.model.position)
  addLog(`🏆 ${winner.name} defeated ${defeated.name}`)
  updateHud()
}

/**
 * Temporary combat rule until the authentic Cambodian rules are added:
 * landing on the opponent's tile attacks them for 20 health.
 */
function resolveBasicCombat(attacker: PlayerState): void {
  const defender = players.find((player) => player.id !== attacker.id)
  if (!defender || defender.tileIndex !== attacker.tileIndex || defender.health <= 0) {
    addLog(`📍 ${attacker.name} landed on ${tiles[attacker.tileIndex].name}`)
    return
  }

  const damage = 20
  defender.health = Math.max(0, defender.health - damage)
  addLog(`⚔️ ${attacker.name} hit ${defender.name} for ${damage} damage`)

  if (defender.health === 0) finishGame(attacker, defender)
}

async function rollTwoDice(): Promise<void> {
  if (moving || gameOver) return
  moving = true
  rollButton.disabled = true

  const player = activePlayer()
  let dieOne = 1
  let dieTwo = 1

  for (let index = 0; index < 10; index += 1) {
    dieOne = Math.floor(Math.random() * 6) + 1
    dieTwo = Math.floor(Math.random() * 6) + 1
    diceOneValue.textContent = String(dieOne)
    diceTwoValue.textContent = String(dieTwo)
    diceTotalValue.textContent = String(dieOne + dieTwo)
    await delay(50 + index * 6)
  }

  const total = dieOne + dieTwo
  addLog(`🎲 ${player.name} rolled ${dieOne} + ${dieTwo} = ${total}`)

  for (let step = 0; step < total; step += 1) {
    const previousIndex = player.tileIndex
    player.tileIndex = (player.tileIndex + 1) % tiles.length
    if (previousIndex === tiles.length - 1 && player.tileIndex === 0) {
      player.laps += 1
      addLog(`🔁 ${player.name} completed lap ${player.laps}`)
    }
    await jumpToTile(player, tiles[player.tileIndex])
    await delay(70)
  }

  cameraController.focusOn(player.model.position)
  resolveBasicCombat(player)
  updateHud()

  if (gameOver) return

  await delay(1050)
  activePlayerIndex = (activePlayerIndex + 1) % players.length
  moving = false
  startTurn()
}

rollButton.addEventListener('click', () => {
  void rollTwoDice()
})

cameraButton.addEventListener('click', () => {
  boardViewOverride = !boardViewOverride
  if (boardViewOverride) {
    cameraController.setBoardView()
    cameraButton.textContent = 'Follow Player'
  } else {
    cameraController.focusOn(activePlayer().model.position)
    cameraButton.textContent = 'Board View'
  }
})

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
    if (!moving || player !== activePlayer()) {
      animateCharacterIdle(player.model, elapsed + index * 0.8, index === activePlayerIndex && !gameOver)
    }
  })

  cameraController.update(delta)
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

updateHud()
addLog('🇰🇭 Cambodian classic board prototype started')
addLog('⚔️ Temporary rule: land on your rival to deal damage')
setActiveCamera()
loading.classList.add('hidden')
render()
