import * as THREE from 'three'

export interface BoardTile {
  index: number
  name: string
  kind: 'start' | 'property' | 'event' | 'tax' | 'bank' | 'jail'
  position: THREE.Vector3
  mesh: THREE.Group
}

const TILE_SIZE = 2.35
const BOARD_WIDTH = 7
const BOARD_HEIGHT = 7

const TILE_NAMES = [
  'START', 'Pixel Café', 'Chance', 'Solar Street', 'City Tax', 'Neon Mall', 'Bank',
  'JAIL', 'Cloud Plaza', 'Chance', 'Metro Hub', 'Code Avenue', 'Power Plant',
  'Free Park', 'Arcade Road', 'Chance', 'River Market', 'Tower Square', 'Luxury Tax',
  'Airport', 'Festival', 'Chance', 'Tech District', 'Royal Hotel',
]

const TILE_KINDS: BoardTile['kind'][] = [
  'start', 'property', 'event', 'property', 'tax', 'property', 'bank',
  'jail', 'property', 'event', 'property', 'property', 'property',
  'event', 'property', 'event', 'property', 'property', 'tax',
  'property', 'event', 'event', 'property', 'property',
]

function makeTileLabel(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(5, 9, 22, 0.88)'
  ctx.roundRect(8, 8, 496, 176, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 5
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 46px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const words = text.split(' ')
  if (words.length > 1) {
    ctx.fillText(words.slice(0, -1).join(' '), 256, 72)
    ctx.fillText(words.at(-1) ?? '', 256, 126)
  } else {
    ctx.fillText(text, 256, 96)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function tileColor(kind: BoardTile['kind']): number {
  switch (kind) {
    case 'start': return 0x22c55e
    case 'event': return 0xa855f7
    case 'tax': return 0xef4444
    case 'bank': return 0x3b82f6
    case 'jail': return 0xf97316
    default: return 0x1f2937
  }
}

function buildPathPositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = []
  const halfW = (BOARD_WIDTH - 1) / 2
  const halfH = (BOARD_HEIGHT - 1) / 2

  for (let x = -halfW; x <= halfW; x += 1) positions.push(new THREE.Vector3(x * TILE_SIZE, 0, halfH * TILE_SIZE))
  for (let z = halfH - 1; z >= -halfH; z -= 1) positions.push(new THREE.Vector3(halfW * TILE_SIZE, 0, z * TILE_SIZE))
  for (let x = halfW - 1; x >= -halfW; x -= 1) positions.push(new THREE.Vector3(x * TILE_SIZE, 0, -halfH * TILE_SIZE))
  for (let z = -halfH + 1; z < halfH; z += 1) positions.push(new THREE.Vector3(-halfW * TILE_SIZE, 0, z * TILE_SIZE))

  return positions
}

export function createBoard(scene: THREE.Scene): BoardTile[] {
  const boardBase = new THREE.Mesh(
    new THREE.BoxGeometry(18.6, 0.75, 18.6),
    new THREE.MeshStandardMaterial({ color: 0x10182a, roughness: 0.72, metalness: 0.08 }),
  )
  boardBase.position.y = -0.5
  boardBase.receiveShadow = true
  scene.add(boardBase)

  const center = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.15, 10.2),
    new THREE.MeshStandardMaterial({ color: 0x14213d, roughness: 0.86 }),
  )
  center.position.y = -0.05
  center.receiveShadow = true
  scene.add(center)

  const grid = new THREE.GridHelper(10, 10, 0x355070, 0x24354f)
  grid.position.y = 0.04
  scene.add(grid)

  const positions = buildPathPositions()
  const tiles: BoardTile[] = positions.map((position, index) => {
    const kind = TILE_KINDS[index]
    const group = new THREE.Group()

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.35, 2.15),
      new THREE.MeshStandardMaterial({
        color: tileColor(kind),
        roughness: 0.62,
        metalness: kind === 'bank' ? 0.25 : 0.05,
      }),
    )
    base.castShadow = true
    base.receiveShadow = true
    base.position.y = 0.18
    group.add(base)

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.82, 0.68),
      new THREE.MeshBasicMaterial({ map: makeTileLabel(TILE_NAMES[index]), transparent: true }),
    )
    label.rotation.x = -Math.PI / 2
    label.position.y = 0.365
    label.position.z = 0.08
    group.add(label)

    if (kind === 'property') {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.7 + (index % 3) * 0.23, 0.58),
        new THREE.MeshStandardMaterial({ color: 0x5eead4, emissive: 0x0f3a38, roughness: 0.45 }),
      )
      building.position.set(0.62, 0.62, -0.55)
      building.castShadow = true
      group.add(building)
    }

    group.position.copy(position)
    scene.add(group)

    return { index, name: TILE_NAMES[index], kind, position, mesh: group }
  })

  const logo = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.35, 48),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.3, roughness: 0.35 }),
  )
  logo.position.y = 0.18
  logo.castShadow = true
  scene.add(logo)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.11, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x075985, emissiveIntensity: 1.3 }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.42
  scene.add(ring)

  return tiles
}
