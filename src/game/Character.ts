import * as THREE from 'three'
import {
  GLTFLoader,
  type GLTF,
} from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

const loader = new GLTFLoader()

let characterAssetPromise: Promise<GLTF> | null = null

function loadCharacterAsset(): Promise<GLTF> {
  if (!characterAssetPromise) {
    characterAssetPromise = loader.loadAsync('/models/char_Sloth.glb')
  }

  return characterAssetPromise
}

export async function createCharacter(
  _accent: number,
): Promise<THREE.Group> {
  const root = new THREE.Group()

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  )

  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  root.add(shadow)

  const gltf = await loadCharacterAsset()

  // Important for animated/skinned GLB characters
  const visual = clone(gltf.scene)

  // Change this if the model is too large or too small
  visual.scale.setScalar(0.55)

  // Change to 0 if the character faces backward
  visual.rotation.y = Math.PI

  visual.position.y = 0

  visual.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  root.add(visual)

  root.userData.visual = visual
  root.userData.shadow = shadow
  root.userData.baseVisualY = visual.position.y

  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(visual)

    const idleClip =
      gltf.animations.find((clip) =>
        clip.name.toLowerCase().includes('idle'),
      ) ?? gltf.animations[0]

    mixer.clipAction(idleClip).play()

    root.userData.mixer = mixer
    root.userData.lastAnimationTime = undefined
  }

  return root
}

export function animateCharacterIdle(
  character: THREE.Group,
  time: number,
  active: boolean,
): void {
  const visual = character.userData.visual as THREE.Group | undefined

  const mixer = character.userData.mixer as
    | THREE.AnimationMixer
    | undefined

  const previousTime = character.userData.lastAnimationTime as
    | number
    | undefined

  if (mixer) {
    const delta =
      previousTime === undefined
        ? 0
        : Math.min(Math.max(time - previousTime, 0), 0.05)

    mixer.update(delta)
    character.userData.lastAnimationTime = time
  }

  if (!visual) return

  const baseY = Number(character.userData.baseVisualY ?? 0)
  const speed = active ? 3.2 : 2
  const amount = active ? 0.035 : 0.018

  visual.position.y =
    baseY + Math.sin(time * speed) * amount
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

  if (progress >= 1) {
    visual.rotation.x = 0
    visual.rotation.z = 0
  }
}