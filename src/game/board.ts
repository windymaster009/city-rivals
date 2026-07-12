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
  baseColor: THREE.Color
  idleEmissive: THREE.Color
  idleEmissiveIntensity: number
  baseMaterial: THREE.MeshStandardMaterial
  glowShell: THREE.Mesh
  glowMaterial: THREE.MeshBasicMaterial
  glowLight: THREE.PointLight
}

export interface BoardState {
  tiles: BoardTile[]
  startTile: BoardTile
}

const TILE_SPACING = 1.78
const TILE_SIZE = 1.58
const HALF_COLUMNS = (BOARD_COLUMNS - 1) / 2
const HALF_ROWS = (BOARD_ROWS - 1) / 2

/**
 * START is a waiting space outside the 63 numbered board tiles.
 * It sits immediately to the left of Tile 1 so the first step enters Tile 1.
 */
export const START_POSITION = new THREE.Vector3(
  -(HALF_COLUMNS + 1) * TILE_SPACING,
  0,
  -HALF_ROWS * TILE_SPACING,
)

interface PathCell {
  row: number
  column: number
  position: THREE.Vector3
}

interface TileVisualOptions {
  index: number
  number: number
  row: number
  column: number
  name: string
  kind: BoardTile['kind']
  position: THREE.Vector3
  baseColor: number
  idleEmissive: number
  idleEmissiveIntensity: number
  labelTexture: THREE.CanvasTexture
  showBeacon?: boolean
}

function makeTileLabel(tileNumber: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(8, 15, 32, 0.92)'
  ctx.roundRect(18, 18, 476, 476, 42)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 8
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '900 164px Inter, Arial, sans-serif'
  ctx.fillText(String(tileNumber), 256, 266)
  ctx.fillStyle = '#64748b'
  ctx.font = '700 42px Inter, Arial, sans-serif'
  ctx.fillText('PLACEHOLDER', 256, 400)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function makeStartLabel(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(6, 78, 59, 0.96)'
  ctx.roundRect(18, 18, 476, 476, 42)
  ctx.fill()

  ctx.strokeStyle = 'rgba(134, 239, 172, 0.95)'
  ctx.lineWidth = 14
  ctx.stroke()

  ctx.fillStyle = '#dcfce7'
  ctx.font = '900 102px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('START', 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Build the 7 x 9 Cambodian board as one continuous snake path.
 *
 * Tile 1 is the top-left board cell. The first row moves left-to-right,
 * the second row moves right-to-left, and the direction alternates until
 * Tile 63. After Tile 63, movement loops directly back to Tile 1 — never START.
 */
function buildSnakePath(): PathCell[] {
  const cells: PathCell[] = []

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    const columns = row % 2 === 0
      ? Array.from({ length: BOARD_COLUMNS }, (_, index) => index)
      : Array.from({ length: BOARD_COLUMNS }, (_, index) => BOARD_COLUMNS - 1 - index)

    for (const column of columns) {
      const x = (column - HALF_COLUMNS) * TILE_SPACING
      const z = (row - HALF_ROWS) * TILE_SPACING
      cells.push({ row, column, position: new THREE.Vector3(x, 0, z) })
    }
  }

  return cells
}

function createRowGuide(scene: THREE.Scene, row: number): void {
  const width = (BOARD_COLUMNS - 1) * TILE_SPACING + TILE_SIZE
  const z = (row - HALF_ROWS) * TILE_SPACING
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

function createTileVisual(scene: THREE.Scene, options: TileVisualOptions): BoardTile {
  const group = new THREE.Group()
  const baseColor = new THREE.Color(options.baseColor)
  const idleEmissive = new THREE.Color(options.idleEmissive)

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: idleEmissive,
    emissiveIntensity: options.idleEmissiveIntensity,
    roughness: 0.62,
    metalness: 0.05,
  })

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(TILE_SIZE, 0.28, TILE_SIZE),
    baseMaterial,
  )
  base.castShadow = true
  base.receiveShadow = true
  base.position.y = 0.14
  group.add(base)

  // This transparent shell belongs to the tile block itself. When occupied,
  // its top and four sides light up in the player's color.
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
  const glowShell = new THREE.Mesh(
    new THREE.BoxGeometry(TILE_SIZE + 0.075, 0.34, TILE_SIZE + 0.075),
    glowMaterial,
  )
  glowShell.position.y = 0.14
  glowShell.renderOrder = 1
  group.add(glowShell)

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE - 0.16, TILE_SIZE - 0.16),
    new THREE.MeshBasicMaterial({
      map: options.labelTexture,
      transparent: true,
      depthWrite: false,
    }),
  )
  label.rotation.x = -Math.PI / 2
  label.position.y = 0.322
  label.renderOrder = 2
  group.add(label)

  const glowLight = new THREE.PointLight(0xffffff, 0, 4.8, 2)
  glowLight.position.y = 0.86
  group.add(glowLight)

  if (options.showBeacon) {
    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.065, 12, 40),
      new THREE.MeshStandardMaterial({
        color: 0x86efac,
        emissive: 0x22c55e,
        emissiveIntensity: 1.5,
      }),
    )
    beacon.rotation.x = Math.PI / 2
    beacon.position.y = 0.43
    group.add(beacon)
  }

  group.position.copy(options.position)
  scene.add(group)

  return {
    index: options.index,
    number: options.number,
    row: options.row,
    column: options.column,
    name: options.name,
    kind: options.kind,
    position: options.position,
    mesh: group,
    baseColor,
    idleEmissive,
    idleEmissiveIntensity: options.idleEmissiveIntensity,
    baseMaterial,
    glowShell,
    glowMaterial,
    glowLight,
  }
}

function createStartSpace(scene: THREE.Scene): BoardTile {
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(TILE_SIZE + 0.36, 0.72, TILE_SIZE + 0.36),
    new THREE.MeshStandardMaterial({
      color: 0x0d3b2b,
      emissive: 0x052e16,
      emissiveIntensity: 0.65,
      roughness: 0.7,
      metalness: 0.06,
    }),
  )
  pedestal.position.copy(START_POSITION)
  pedestal.position.y = -0.47
  pedestal.castShadow = true
  pedestal.receiveShadow = true
  scene.add(pedestal)

  return createTileVisual(scene, {
    index: -1,
    number: 0,
    row: 0,
    column: -1,
    name: 'Start',
    kind: 'start',
    position: START_POSITION.clone(),
    baseColor: 0x166534,
    idleEmissive: 0x052e16,
    idleEmissiveIntensity: 0.95,
    labelTexture: makeStartLabel(),
    showBeacon: true,
  })
}

function mixColors(colors: readonly number[]): THREE.Color {
  const mixed = new THREE.Color(0x000000)

  for (const colorValue of colors) {
    mixed.r += ((colorValue >> 16) & 0xff) / 255
    mixed.g += ((colorValue >> 8) & 0xff) / 255
    mixed.b += (colorValue & 0xff) / 255
  }

  return mixed.multiplyScalar(1 / Math.max(colors.length, 1))
}

/**
 * Apply occupancy lighting directly to a board tile.
 * Multiple players blend their colors; the active player's color is favored.
 */
export function setBoardTileGlow(
  tile: BoardTile,
  occupantColors: readonly number[],
  activeColor: number | undefined,
  pulse: number,
): void {
  if (occupantColors.length === 0) {
    tile.baseMaterial.color.copy(tile.baseColor)
    tile.baseMaterial.emissive.copy(tile.idleEmissive)
    tile.baseMaterial.emissiveIntensity = tile.idleEmissiveIntensity
    tile.glowMaterial.opacity = 0
    tile.glowLight.intensity = 0
    tile.glowShell.scale.setScalar(1)
    return
  }

  const mixed = mixColors(occupantColors)
  if (activeColor !== undefined) {
    mixed.lerp(new THREE.Color(activeColor), 0.34)
  }

  const safePulse = THREE.MathUtils.clamp(pulse, 0, 1)
  const sharedBoost = Math.min((occupantColors.length - 1) * 0.16, 0.36)
  const activeBoost = activeColor === undefined ? 0 : 0.26
  const strength = THREE.MathUtils.clamp(0.58 + sharedBoost + activeBoost, 0, 1.2)

  tile.baseMaterial.color.copy(tile.baseColor).lerp(mixed, 0.14 + (strength * 0.12))
  tile.baseMaterial.emissive.copy(mixed)
  tile.baseMaterial.emissiveIntensity = 0.9 + (strength * 1.8) + (safePulse * 0.48)

  tile.glowMaterial.color.copy(mixed)
  tile.glowMaterial.opacity = 0.1 + (strength * 0.26) + (safePulse * 0.08)
  tile.glowShell.scale.setScalar(1 + (safePulse * 0.016))

  tile.glowLight.color.copy(mixed)
  tile.glowLight.intensity = 2.8 + (strength * 7.5) + (safePulse * 1.7)
}

export function createBoard(scene: THREE.Scene): BoardState {
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
  const startTile = createStartSpace(scene)

  const cells = buildSnakePath()
  const tiles: BoardTile[] = cells.map((cell, index) => {
    const rowColor = cell.row % 2 === 0 ? 0x1e293b : 0x24324a

    return createTileVisual(scene, {
      index,
      number: index + 1,
      row: cell.row,
      column: cell.column,
      name: `Tile ${index + 1}`,
      kind: 'placeholder',
      position: cell.position,
      baseColor: rowColor,
      idleEmissive: 0x000000,
      idleEmissiveIntensity: 0,
      labelTexture: makeTileLabel(index + 1),
    })
  })

  return { tiles, startTile }
}
