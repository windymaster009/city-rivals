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
const diceValue = requireElement<HTMLElement>('#dice-value')
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

const cyanLight = new THREE.PointLight(0x22d3ee, 18, 18, 2)
cyanLight.position.set(0, 4.5, 0)
scene.add(cyanLight)

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
    money: 1500,
    health: 100,
    properties: 0,
    tileIndex: 0,
    accent: 0x22d3ee,
    model: createCharacter(0x22d3ee),
  },
  {
    id: 'rival',
    name: 'Rival',
    money: 1500,
    health: 100,
    properties: 0,
    tileIndex: 0,
    accent: 0xf472b6,
    model: createCharacter(0xf472b6),
  },
]

players.forEach((player, index) => {
  const spawn = tiles[0].position.clone()
  spawn.x += index === 0 ? -0.42 : 0.42
  spawn.z += index === 0 ? -0.35 : 0.35
  player.model.position.copy(spawn)
  scene.add(player.model)
})

let activePlayerIndex = 0
let moving = false
let boardViewOverride = false
let logEntries: string[] = []
const clock = new THREE.Clock()

function activePlayer(): PlayerState {
  return players[activePlayerIndex]
}

function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`
}

function addLog(message: string): void {
  logEntries = [message, ...logEntries].slice(0, 5)
  eventLog.innerHTML = logEntries.map((entry) => `<div class="log-entry">${entry}</div>`).join('')
}

function updateHud(): void {
  playerStatus.innerHTML = players.map((player, index) => {
    const isActive = index === activePlayerIndex
    return `
      <article class="player-card ${isActive ? 'active' : ''}" style="--accent:${hexColor(player.accent)}">
        <div class="avatar">${player.name.slice(0, 1)}</div>
        <div class="player-copy">
          <div class="name-line"><strong>${player.name}</strong>${isActive ? '<span>TURN</span>' : ''}</div>
          <div class="stats"><span>❤️ ${player.health}</span><span>💰 $${player.money}</span><span>🏠 ${player.properties}</span></div>
        </div>
      </article>
    `
  }).join('')

  turnLabel.textContent = `${activePlayer().name}'s turn`
}

function setActiveCamera(): void {
  boardViewOverride = false
  cameraController.focusOn(activePlayer().model.position)
  cameraButton.textContent = 'Board View'
}

function startTurn(): void {
  updateHud()
  setActiveCamera()
  rollButton.disabled = false
  diceValue.textContent = '–'
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
  const playerOffset = player.id === 'windy' ? -0.27 : 0.27
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
    const duration = 430
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

function applyTileEffect(player: PlayerState, tile: BoardTile): void {
  if (tile.kind === 'property') {
    const price = 120 + (tile.index % 4) * 35
    if (player.money >= price) {
      player.money -= price
      player.properties += 1
      addLog(`🏠 ${player.name} bought ${tile.name} for $${price}`)
    }
  } else if (tile.kind === 'tax') {
    player.money = Math.max(0, player.money - 100)
    addLog(`💸 ${player.name} paid $100 city tax`)
  } else if (tile.kind === 'bank') {
    player.money += 150
    addLog(`🏦 ${player.name} received a $150 bank bonus`)
  } else if (tile.kind === 'event') {
    const reward = Math.random() > 0.5 ? 100 : -75
    player.money = Math.max(0, player.money + reward)
    addLog(reward > 0 ? `✨ ${player.name} won $${reward}` : `⚠️ ${player.name} lost $${Math.abs(reward)}`)
  } else if (tile.kind === 'jail') {
    player.health = Math.max(0, player.health - 10)
    addLog(`🚔 ${player.name} hit jail and lost 10 health`)
  } else {
    addLog(`📍 ${player.name} landed on ${tile.name}`)
  }
}

async function rollDice(): Promise<void> {
  if (moving) return
  moving = true
  rollButton.disabled = true

  const player = activePlayer()
  let roll = 1
  for (let index = 0; index < 9; index += 1) {
    roll = Math.floor(Math.random() * 6) + 1
    diceValue.textContent = String(roll)
    await delay(55 + index * 6)
  }

  addLog(`🎲 ${player.name} rolled ${roll}`)

  for (let step = 0; step < roll; step += 1) {
    player.tileIndex = (player.tileIndex + 1) % tiles.length
    await jumpToTile(player, tiles[player.tileIndex])
    await delay(85)
  }

  const landedTile = tiles[player.tileIndex]
  cameraController.focusOn(player.model.position)
  applyTileEffect(player, landedTile)
  updateHud()

  await delay(1100)
  activePlayerIndex = (activePlayerIndex + 1) % players.length
  moving = false
  startTurn()
}

rollButton.addEventListener('click', () => {
  void rollDice()
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
      animateCharacterIdle(player.model, elapsed + index * 0.8, index === activePlayerIndex)
    }
  })

  cameraController.update(delta)
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

updateHud()
addLog('🏙️ Welcome to City Rivals')
setActiveCamera()
loading.classList.add('hidden')
render()
