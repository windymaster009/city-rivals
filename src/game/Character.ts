import * as THREE from 'three'
import {
  GLTFLoader,
  type GLTF,
} from 'three/addons/loaders/GLTFLoader.js'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
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
const CHARACTER_CREASE_ANGLE = THREE.MathUtils.degToRad(70)
const NORMAL_MAP_STRENGTH = 0.18

let glowTexture: THREE.CanvasTexture | undefined

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

function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')

  const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 124)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.62)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.20)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  glowTexture.needsUpdate = true
  return glowTexture
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

function createPlayerGlow(accent: number): {
  aura: THREE.Mesh
  auraMaterial: THREE.MeshBasicMaterial
  ring: THREE.Mesh
  ringMaterial: THREE.MeshBasicMaterial
  light: THREE.PointLight
} {
  const auraMaterial = new THREE.MeshBasicMaterial({
    map: getGlowTexture(),
    color: accent,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })

  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(2.45, 2.45),
    auraMaterial,
  )
  aura.rotation.x = -Math.PI / 2
  aura.position.y = 0.035
  aura.renderOrder = 3

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.57, 0.7, 48),
    ringMaterial,
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.045
  ring.renderOrder = 4

  // Keep the colour glow subtle. A strong light this close to the model
  // exaggerates every triangle and makes smooth characters look 3D-printed.
  const light = new THREE.PointLight(accent, 0.35, 3.5, 2)
  light.position.set(0, 0.42, 0)

  return { aura, auraMaterial, ring, ringMaterial, light }
}

function tuneCharacterMaterial(source: THREE.Material): THREE.Material {
  const material = source.clone()

  if (material instanceof THREE.MeshStandardMaterial) {
    material.flatShading = false
    material.roughness = THREE.MathUtils.clamp(material.roughness, 0.35, 0.72)
    material.metalness = Math.min(material.metalness, 0.05)
    material.envMapIntensity = 0.8

    if (material.normalMap) {
      material.normalScale.set(NORMAL_MAP_STRENGTH, NORMAL_MAP_STRENGTH)
    }

    material.needsUpdate = true
  }

  return material
}

function smoothCharacterGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const clonedGeometry = source.clone()

  // Tangents were generated for the old normals. Removing them lets Three.js
  // derive a fresh tangent basis for the softened normal map at render time.
  clonedGeometry.deleteAttribute('normal')
  clonedGeometry.deleteAttribute('tangent')

  const smoothedGeometry = toCreasedNormals(
    clonedGeometry,
    CHARACTER_CREASE_ANGLE,
  )

  if (smoothedGeometry !== clonedGeometry) {
    clonedGeometry.dispose()
  }

  smoothedGeometry.computeBoundingBox()
  smoothedGeometry.computeBoundingSphere()
  return smoothedGeometry
}

function cloneRenderableScene(source: THREE.Group): THREE.Group {
  const visual = clone(source) as THREE.Group

  visual.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    const hasMorphTargets = Object.keys(object.geometry.morphAttributes).length > 0
    const canRebuildNormals = !(object instanceof THREE.SkinnedMesh) && !hasMorphTargets

    object.geometry = canRebuildNormals
      ? smoothCharacterGeometry(object.geometry)
      : object.geometry.clone()

    object.material = Array.isArray(object.material)
      ? object.material.map(tuneCharacterMaterial)
      : tuneCharacterMaterial(object.material)

    object.castShadow = true
    object.receiveShadow = true
  })

  return visual
}

function normalizeVisual(
  visual: THREE.Group,
  facingY: number,
): void {
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

function updateGlowState(
  character: THREE.Group,
  strength: number,
  pulse: number,
): void {
  const aura = character.userData.aura as THREE.Mesh | undefined
  const auraMaterial = character.userData.auraMaterial as THREE.MeshBasicMaterial | undefined
  const ring = character.userData.glowRing as THREE.Mesh | undefined
  const ringMaterial = character.userData.ringMaterial as THREE.MeshBasicMaterial | undefined
  const light = character.userData.playerLight as THREE.PointLight | undefined
  const shadow = character.userData.shadow as THREE.Mesh | undefined

  if (!aura || !auraMaterial || !ring || !ringMaterial || !light) return

  // Keep the board effects on the floor even while the character jumps.
  const parentScaleY = Math.max(Math.abs(character.scale.y), 0.0001)
  const floorY = (0.035 - character.position.y) / parentScaleY
  aura.position.y = floorY
  ring.position.y = floorY + (0.01 / parentScaleY)
  light.position.y = (0.42 - character.position.y) / parentScaleY
  if (shadow) shadow.position.y = floorY - (0.012 / parentScaleY)

  const safeStrength = THREE.MathUtils.clamp(strength, 0, 1)
  const safePulse = THREE.MathUtils.clamp(pulse, 0, 1)

  auraMaterial.opacity = 0.18 + (safeStrength * 0.34) + (safePulse * 0.08)
  ringMaterial.opacity = 0.26 + (safeStrength * 0.58) + (safePulse * 0.12)
  light.intensity = 0.15 + (safeStrength * 0.75) + (safePulse * 0.25)

  aura.scale.setScalar(0.88 + (safeStrength * 0.18) + (safePulse * 0.06))
  ring.scale.setScalar(0.94 + (safeStrength * 0.1) + (safePulse * 0.05))
}

export async function createCharacter(
  accent: number,
  model: CharacterModelDefinition,
): Promise<THREE.Group> {
  const root = new THREE.Group()
  const shadow = createShadow()
  const { aura, auraMaterial, ring, ringMaterial, light } = createPlayerGlow(accent)

  root.add(aura)
  root.add(ring)
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
  root.userData.aura = aura
  root.userData.auraMaterial = auraMaterial
  root.userData.glowRing = ring
  root.userData.ringMaterial = ringMaterial
  root.userData.playerLight = light
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

  updateGlowState(root, 0.25, 0)
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
  updateGlowState(character, active ? 1 : 0.25, pulse)
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

  // Bright moving glow follows the character across the board.
  updateGlowState(character, 1, lift)

  if (progress >= 1) {
    visual.rotation.x = 0
    visual.rotation.z = 0
  }
}
