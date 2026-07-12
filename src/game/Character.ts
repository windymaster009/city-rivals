import * as THREE from 'three'
import {
  GLTFLoader,
  type GLTF,
} from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

export interface CharacterModelDefinition {
  name: string
  path: string
  facingY?: number
}

export const CHARACTER_MODELS: CharacterModelDefinition[] = [
  { name: 'Sloth', path: '/models/char_Sloth.glb', facingY: 0 },
  { name: 'Animal', path: '/models/char_animal.glb', facingY: 0 },
  { name: 'Bird', path: '/models/char_bird.glb', facingY: 0 },
  { name: 'Chicken', path: '/models/char_chicken.glb', facingY: 0 },
  { name: 'Deer', path: '/models/char_deer.glb', facingY: 0 },
  { name: 'Kangaroo', path: '/models/char_kangaroo.glb', facingY: 0 },
]

const loader = new GLTFLoader()
const assetCache = new Map<string, Promise<GLTF>>()
const LOAD_TIMEOUT_MS = 15_000
const TARGET_CHARACTER_HEIGHT = 2.05
const BOARD_GLOW_WORLD_Y = 0.315

let tileGlowTexture: THREE.CanvasTexture | undefined

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

export function pickUniqueCharacterModels(count: number): CharacterModelDefinition[] {
  if (count < 1 || count > CHARACTER_MODELS.length) {
    throw new Error(`Character count must be between 1 and ${CHARACTER_MODELS.length}`)
  }

  return shuffle(CHARACTER_MODELS).slice(0, count)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} did not load within ${timeoutMs / 1000} seconds`))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function loadCharacterAsset(model: CharacterModelDefinition): Promise<GLTF> {
  const cached = assetCache.get(model.path)
  if (cached) return cached

  const pending = withTimeout(
    loader.loadAsync(model.path),
    LOAD_TIMEOUT_MS,
    model.name,
  ).catch((error: unknown) => {
    assetCache.delete(model.path)
    throw error
  })

  assetCache.set(model.path, pending)
  return pending
}

function getTileGlowTexture(): THREE.CanvasTexture {
  if (tileGlowTexture) return tileGlowTexture

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')

  context.clearRect(0, 0, canvas.width, canvas.height)

  // Soft fill across the whole tile.
  context.fillStyle = 'rgba(255,255,255,0.17)'
  context.roundRect(46, 46, 420, 420, 46)
  context.fill()

  // Several borders create a broad neon bloom instead of a small circle.
  for (let layer = 0; layer < 8; layer += 1) {
    const inset = 28 + (layer * 6)
    const alpha = 0.12 + ((7 - layer) * 0.08)
    context.strokeStyle = `rgba(255,255,255,${alpha})`
    context.lineWidth = 22 - (layer * 2)
    context.beginPath()
    context.roundRect(inset, inset, 512 - (inset * 2), 512 - (inset * 2), 54 - layer)
    context.stroke()
  }

  context.shadowColor = 'rgba(255,255,255,0.95)'
  context.shadowBlur = 34
  context.strokeStyle = 'rgba(255,255,255,0.88)'
  context.lineWidth = 8
  context.beginPath()
  context.roundRect(54, 54, 404, 404, 44)
  context.stroke()

  tileGlowTexture = new THREE.CanvasTexture(canvas)
  tileGlowTexture.colorSpace = THREE.SRGBColorSpace
  tileGlowTexture.needsUpdate = true
  return tileGlowTexture
}

function createShadow(): THREE.Mesh {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  )

  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  shadow.renderOrder = 2
  return shadow
}

function createBoardGlow(accent: number): {
  glow: THREE.Mesh
  glowMaterial: THREE.MeshBasicMaterial
  light: THREE.PointLight
} {
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: getTileGlowTexture(),
    color: accent,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  })

  // Main.ts scales every character root to 0.7. This becomes approximately
  // one full board tile after that scale is applied.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.34, 2.34),
    glowMaterial,
  )
  glow.rotation.x = -Math.PI / 2
  glow.renderOrder = 8

  // The light belongs to the board glow, not to a tiny character aura.
  const light = new THREE.PointLight(accent, 7, 5.2, 2)

  return { glow, glowMaterial, light }
}

function cloneRenderableScene(source: THREE.Group): THREE.Group {
  const visual = clone(source) as THREE.Group

  visual.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    object.geometry = object.geometry.clone()
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
    object.castShadow = true
    object.receiveShadow = true
  })

  return visual
}

function normalizeVisual(visual: THREE.Group, facingY: number): void {
  visual.rotation.y = facingY
  visual.updateMatrixWorld(true)

  let bounds = new THREE.Box3().setFromObject(visual)
  const size = new THREE.Vector3()
  bounds.getSize(size)

  if (size.y > 0.0001) {
    visual.scale.setScalar(TARGET_CHARACTER_HEIGHT / size.y)
  }

  visual.updateMatrixWorld(true)
  bounds = new THREE.Box3().setFromObject(visual)

  const center = new THREE.Vector3()
  bounds.getCenter(center)
  visual.position.x -= center.x
  visual.position.z -= center.z
  visual.position.y -= bounds.min.y
}

function createFallbackVisual(accent: number): THREE.Group {
  const visual = new THREE.Group()
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.48,
  })
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.7,
  })

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.72, 7, 14),
    bodyMaterial,
  )
  body.position.y = 1.02
  body.castShadow = true
  visual.add(body)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, 20, 16),
    bodyMaterial,
  )
  head.position.y = 1.76
  head.castShadow = true
  visual.add(head)

  const feet = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.2, 0.4),
    darkMaterial,
  )
  feet.position.y = 0.12
  feet.castShadow = true
  visual.add(feet)

  return visual
}

function updateBoardGlow(
  character: THREE.Group,
  strength: number,
  pulse: number,
): void {
  const glow = character.userData.boardGlow as THREE.Mesh | undefined
  const glowMaterial = character.userData.boardGlowMaterial as THREE.MeshBasicMaterial | undefined
  const light = character.userData.boardGlowLight as THREE.PointLight | undefined
  const shadow = character.userData.shadow as THREE.Mesh | undefined

  if (!glow || !glowMaterial || !light) return

  // Keep the square glow on the board surface while the model jumps above it.
  const parentScaleY = Math.max(Math.abs(character.scale.y), 0.0001)
  const floorY = (BOARD_GLOW_WORLD_Y - character.position.y) / parentScaleY
  glow.position.y = floorY
  light.position.y = (0.72 - character.position.y) / parentScaleY

  if (shadow) {
    shadow.position.y = (0.305 - character.position.y) / parentScaleY
  }

  const safeStrength = THREE.MathUtils.clamp(strength, 0, 1)
  const safePulse = THREE.MathUtils.clamp(pulse, 0, 1)

  glowMaterial.opacity = 0.16 + (safeStrength * 0.34) + (safePulse * 0.1)
  light.intensity = 3.5 + (safeStrength * 11) + (safePulse * 3)

  const scale = 0.98 + (safeStrength * 0.04) + (safePulse * 0.035)
  glow.scale.setScalar(scale)
}

export async function createCharacter(
  accent: number,
  model: CharacterModelDefinition,
): Promise<THREE.Group> {
  const root = new THREE.Group()
  const shadow = createShadow()
  const { glow, glowMaterial, light } = createBoardGlow(accent)

  root.add(glow)
  root.add(shadow)
  root.add(light)

  let visual: THREE.Group
  let animations: THREE.AnimationClip[] = []

  try {
    const gltf = await loadCharacterAsset(model)
    visual = cloneRenderableScene(gltf.scene)
    animations = gltf.animations
    normalizeVisual(visual, model.facingY ?? 0)
  } catch (error) {
    console.error(`Failed to load ${model.name}:`, error)
    visual = createFallbackVisual(accent)
    root.userData.usedFallback = true
  }

  root.add(visual)
  root.userData.visual = visual
  root.userData.shadow = shadow
  root.userData.boardGlow = glow
  root.userData.boardGlowMaterial = glowMaterial
  root.userData.boardGlowLight = light
  root.userData.baseVisualY = visual.position.y
  root.userData.characterName = model.name
  root.userData.characterPath = model.path

  if (animations.length > 0) {
    const mixer = new THREE.AnimationMixer(visual)
    const idleClip =
      animations.find((clip) => clip.name.toLowerCase().includes('idle'))
      ?? animations[0]

    mixer.clipAction(idleClip).play()
    root.userData.mixer = mixer
    root.userData.lastAnimationTime = undefined
  }

  updateBoardGlow(root, 0.3, 0)
  return root
}

export function animateCharacterIdle(
  character: THREE.Group,
  time: number,
  active: boolean,
): void {
  const visual = character.userData.visual as THREE.Group | undefined
  const mixer = character.userData.mixer as THREE.AnimationMixer | undefined
  const previousTime = character.userData.lastAnimationTime as number | undefined

  if (mixer) {
    const delta = previousTime === undefined
      ? 0
      : Math.min(Math.max(time - previousTime, 0), 0.05)

    mixer.update(delta)
    character.userData.lastAnimationTime = time
  }

  if (visual) {
    const baseY = Number(character.userData.baseVisualY ?? 0)
    const speed = active ? 3.2 : 2
    const amount = active ? 0.035 : 0.018
    visual.position.y = baseY + Math.sin(time * speed) * amount
  }

  const pulse = active ? (Math.sin(time * 4.2) + 1) * 0.5 : 0
  updateBoardGlow(character, active ? 1 : 0.3, pulse)
}

export function animateJumpPose(
  character: THREE.Group,
  progress: number,
): void {
  const visual = character.userData.visual as THREE.Group | undefined
  if (!visual) return

  const lift = Math.sin(progress * Math.PI)
  visual.rotation.x = -0.12 * lift
  visual.rotation.z = 0.08 * lift

  // The full tile-sized glow travels across the board with the player.
  updateBoardGlow(character, 1, lift)

  if (progress >= 1) {
    visual.rotation.x = 0
    visual.rotation.z = 0
  }
}
