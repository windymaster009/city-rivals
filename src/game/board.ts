import * as THREE from 'three'

export interface BoardTile {
  index: number
  name: string
  kind: 'start' | 'path'
  position: THREE.Vector3
  mesh: THREE.Group
}

const TILE_SIZE = 2.35
const BOARD_WIDTH = 7
const BOARD_HEIGHT = 7
const TILE_COUNT = (BOARD_WIDTH * 2) + (BOARD_HEIGHT * 2) - 4

const TILE_NAMES = Array.from({ length: TILE_COUNT }, (_, index) => (
  index === 0 ? 'START' : `STEP ${index}`
))

function makeTileLabel(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(5, 9, 22, 0.9)'
  ctx.roundRect(8, 8, 496, 176, 28)
  ctx.fill()
  ctx.strokeStyle = text === 'START' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255,255,255,0.18)'
  ctx.lineWidth = text === 'START' ? 9 : 5
  ctx.stroke()

  ctx.fillStyle = text === 'START' ? '#86efac' : '#ffffff'
  ctx.font = text === 'START'
    ? '800 52px Inter, Arial, sans-serif'
    : '700 44px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 96)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * The old Cambodian board starts at the top-right corner.
 * Indexes then move clockwise: down the right side, across the bottom,
 * up the left side, and back across the top to repeat the loop.
 */
function buildPathPositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = []
  const halfW = (BOARD_WIDTH - 1) / 2
  const halfH = (BOARD_HEIGHT - 1) / 2

  // Top-right START, then move down the right edge.
  for (let z = halfH; z >= -halfH; z -= 1) {
    positions.push(new THREE.Vector3(halfW * TILE_SIZE, 0, z * TILE_SIZE))
  }

  // Bottom edge, moving right to left (the corner is already included).
  for (let x = halfW - 1; x >= -halfW; x -= 1) {
    positions.push(new THREE.Vector3(x * TILE_SIZE, 0, -halfH * TILE_SIZE))
  }

  // Left edge, moving bottom to top.
  for (let z = -halfH + 1; z <= halfH; z += 1) {
    positions.push(new THREE.Vector3(-halfW * TILE_SIZE, 0, z * TILE_SIZE))
  }

  // Top edge, moving left to right, stopping before START.
  for (let x = -halfW + 1; x < halfW; x += 1) {
    positions.push(new THREE.Vector3(x * TILE_SIZE, 0, halfH * TILE_SIZE))
  }

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
    const kind: BoardTile['kind'] = index === 0 ? 'start' : 'path'
    const group = new THREE.Group()

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.35, 2.15),
      new THREE.MeshStandardMaterial({
        color: kind === 'start' ? 0x166534 : 0x1f2937,
        emissive: kind === 'start' ? 0x052e16 : 0x000000,
        emissiveIntensity: kind === 'start' ? 0.85 : 0,
        roughness: 0.62,
        metalness: 0.05,
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

    if (kind === 'start') {
      const startBeacon = new THREE.Mesh(
        new THREE.TorusGeometry(0.67, 0.08, 12, 40),
        new THREE.MeshStandardMaterial({
          color: 0x86efac,
          emissive: 0x22c55e,
          emissiveIntensity: 1.4,
        }),
      )
      startBeacon.rotation.x = Math.PI / 2
      startBeacon.position.y = 0.55
      group.add(startBeacon)
    }

    group.position.copy(position)
    scene.add(group)

    return { index, name: TILE_NAMES[index], kind, position, mesh: group }
  })

  const centerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.55, 0.35, 48),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.3, roughness: 0.35 }),
  )
  centerDisc.position.y = 0.18
  centerDisc.castShadow = true
  scene.add(centerDisc)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.11, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 1.3 }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.42
  scene.add(ring)

  return tiles
}
