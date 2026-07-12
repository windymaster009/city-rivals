import * as THREE from 'three'

export const BOARD_COLUMNS = 7
export const BOARD_ROWS = 9
export const BOARD_TILE_COUNT = BOARD_COLUMNS * BOARD_ROWS

export interface BoardTile {
  index: number
  number: number
  row: number
  column: number
  name: string
  kind: 'start' | 'placeholder'
  position: THREE.Vector3
  mesh: THREE.Group
}

const TILE_SPACING = 1.78
const TILE_SIZE = 1.58

interface PathCell {
  row: number
  column: number
  position: THREE.Vector3
}

function makeTileLabel(tileNumber: number, isStart: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = isStart ? 'rgba(6, 78, 59, 0.96)' : 'rgba(8, 15, 32, 0.92)'
  ctx.roundRect(18, 18, 476, 476, 42)
  ctx.fill()

  ctx.strokeStyle = isStart ? 'rgba(134, 239, 172, 0.95)' : 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = isStart ? 14 : 8
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (isStart) {
    ctx.fillStyle = '#86efac'
    ctx.font = '800 78px Inter, Arial, sans-serif'
    ctx.fillText('START', 256, 198)
    ctx.fillStyle = '#dcfce7'
    ctx.font = '900 132px Inter, Arial, sans-serif'
    ctx.fillText(String(tileNumber), 256, 334)
  } else {
    ctx.fillStyle = '#f8fafc'
    ctx.font = '900 164px Inter, Arial, sans-serif'
    ctx.fillText(String(tileNumber), 256, 266)
    ctx.fillStyle = '#64748b'
    ctx.font = '700 42px Inter, Arial, sans-serif'
    ctx.fillText('PLACEHOLDER', 256, 400)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Build the 7 x 9 Cambodian board as one continuous snake path.
 *
 * Movement starts at the top-right cell. The first row moves right-to-left,
 * the second row moves left-to-right, and the direction alternates until the
 * final cell. After tile 63, movement loops back to tile 1.
 */
function buildSnakePath(): PathCell[] {
  const cells: PathCell[] = []
  const halfColumns = (BOARD_COLUMNS - 1) / 2
  const halfRows = (BOARD_ROWS - 1) / 2

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    const columns = row % 2 === 0
      ? Array.from({ length: BOARD_COLUMNS }, (_, index) => BOARD_COLUMNS - 1 - index)
      : Array.from({ length: BOARD_COLUMNS }, (_, index) => index)

    for (const column of columns) {
      const x = (column - halfColumns) * TILE_SPACING
      const z = (row - halfRows) * TILE_SPACING
      cells.push({ row, column, position: new THREE.Vector3(x, 0, z) })
    }
  }

  return cells
}

function createRowGuide(scene: THREE.Scene, row: number): void {
  const width = (BOARD_COLUMNS - 1) * TILE_SPACING + TILE_SIZE
  const z = (row - (BOARD_ROWS - 1) / 2) * TILE_SPACING
  const guide = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.28, 0.035, TILE_SIZE + 0.24),
    new THREE.MeshBasicMaterial({
      color: row % 2 === 0 ? 0x172554 : 0x0f2942,
      transparent: true,
      opacity: 0.42,
    }),
  )
  guide.position.set(0, -0.005, z)
  scene.add(guide)
}

export function createBoard(scene: THREE.Scene): BoardTile[] {
  const boardWidth = ((BOARD_COLUMNS - 1) * TILE_SPACING) + TILE_SIZE + 1.15
  const boardDepth = ((BOARD_ROWS - 1) * TILE_SPACING) + TILE_SIZE + 1.15

  const boardBase = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth, 0.72, boardDepth),
    new THREE.MeshStandardMaterial({ color: 0x0e172a, roughness: 0.76, metalness: 0.08 }),
  )
  boardBase.position.y = -0.47
  boardBase.receiveShadow = true
  scene.add(boardBase)

  const innerBase = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth - 0.5, 0.08, boardDepth - 0.5),
    new THREE.MeshStandardMaterial({ color: 0x111d33, roughness: 0.92 }),
  )
  innerBase.position.y = -0.06
  innerBase.receiveShadow = true
  scene.add(innerBase)

  for (let row = 0; row < BOARD_ROWS; row += 1) createRowGuide(scene, row)

  const cells = buildSnakePath()
  const tiles: BoardTile[] = cells.map((cell, index) => {
    const isStart = index === 0
    const kind: BoardTile['kind'] = isStart ? 'start' : 'placeholder'
    const group = new THREE.Group()

    const rowColor = cell.row % 2 === 0 ? 0x1e293b : 0x24324a
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE, 0.28, TILE_SIZE),
      new THREE.MeshStandardMaterial({
        color: isStart ? 0x166534 : rowColor,
        emissive: isStart ? 0x052e16 : 0x000000,
        emissiveIntensity: isStart ? 0.95 : 0,
        roughness: 0.62,
        metalness: 0.05,
      }),
    )
    base.castShadow = true
    base.receiveShadow = true
    base.position.y = 0.14
    group.add(base)

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE - 0.16, TILE_SIZE - 0.16),
      new THREE.MeshBasicMaterial({
        map: makeTileLabel(index + 1, isStart),
        transparent: true,
        depthWrite: false,
      }),
    )
    label.rotation.x = -Math.PI / 2
    label.position.y = 0.292
    group.add(label)

    if (isStart) {
      const beacon = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.065, 12, 40),
        new THREE.MeshStandardMaterial({
          color: 0x86efac,
          emissive: 0x22c55e,
          emissiveIntensity: 1.5,
        }),
      )
      beacon.rotation.x = Math.PI / 2
      beacon.position.y = 0.42
      group.add(beacon)
    }

    group.position.copy(cell.position)
    scene.add(group)

    return {
      index,
      number: index + 1,
      row: cell.row,
      column: cell.column,
      name: isStart ? 'Start / Tile 1' : `Tile ${index + 1}`,
      kind,
      position: cell.position,
      mesh: group,
    }
  })

  return tiles
}
