import '../styles/settings-functional.css'
import * as THREE from 'three'
import {
  fpsLimitAsNumber,
  gameSettings,
  parseResolution,
  type GameSettingsSnapshot,
  type ShadowQualityOption,
  type TextureQualityOption,
} from './settings/GameSettings'

interface RendererRuntimeState {
  settingsVersion: number
  lastRenderedAt: number
}

const rendererStates = new WeakMap<THREE.WebGLRenderer, RendererRuntimeState>()
const originalRender = THREE.WebGLRenderer.prototype.render
const originalSetSize = THREE.WebGLRenderer.prototype.setSize
let settingsVersion = 1
let currentSettings: Readonly<GameSettingsSnapshot> = gameSettings.get()

function graphicsSignature(settings: Readonly<GameSettingsSnapshot>): string {
  return [
    settings.resolution,
    settings.vsync,
    settings.fpsLimit,
    settings.shadowQuality,
    settings.textureQuality,
  ].join('|')
}

let currentGraphicsSignature = graphicsSignature(currentSettings)

function shadowMapSize(quality: ShadowQualityOption): number {
  const sizes: Readonly<Record<ShadowQualityOption, number>> = {
    Off: 0,
    Low: 512,
    Medium: 1024,
    High: 2048,
    Epic: 4096,
  }
  return sizes[quality]
}

function textureAnisotropy(renderer: THREE.WebGLRenderer, quality: TextureQualityOption): number {
  const maximum = renderer.capabilities.getMaxAnisotropy()
  const levels: Readonly<Record<TextureQualityOption, number>> = {
    Low: 1,
    Medium: Math.min(2, maximum),
    High: Math.min(8, maximum),
    Ultra: maximum,
  }
  return levels[quality]
}

function applyTextureQuality(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Object3D,
  quality: TextureQualityOption,
): void {
  const anisotropy = textureAnisotropy(renderer, quality)

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]

    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (!(value instanceof THREE.Texture)) return
        if (value.anisotropy === anisotropy) return
        value.anisotropy = anisotropy
        value.needsUpdate = true
      })
    })
  })
}

function applyShadowQuality(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Object3D,
  quality: ShadowQualityOption,
): void {
  const size = shadowMapSize(quality)
  renderer.shadowMap.enabled = quality !== 'Off'
  renderer.shadowMap.type = quality === 'Low' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap

  scene.traverse((object) => {
    if (
      !(object instanceof THREE.DirectionalLight)
      && !(object instanceof THREE.SpotLight)
      && !(object instanceof THREE.PointLight)
    ) return

    const savedCastShadow = typeof object.userData.settingsOriginalCastShadow === 'boolean'
      ? object.userData.settingsOriginalCastShadow
      : object.castShadow
    object.userData.settingsOriginalCastShadow = savedCastShadow
    object.castShadow = quality !== 'Off' && savedCastShadow

    if (size === 0 || object.shadow.mapSize.width === size) return

    object.shadow.mapSize.set(size, size)
    object.shadow.map?.dispose()
    object.shadow.map = null
    object.shadow.needsUpdate = true
  })

  renderer.shadowMap.needsUpdate = true
}

function applyRendererSettings(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Object3D,
  camera: THREE.Camera,
): void {
  const { width, height } = parseResolution(currentSettings.resolution)
  renderer.setPixelRatio(1)
  originalSetSize.call(renderer, width, height, false)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  applyShadowQuality(renderer, scene, currentSettings.shadowQuality)
  applyTextureQuality(renderer, scene, currentSettings.textureQuality)
}

THREE.WebGLRenderer.prototype.render = function renderWithGameSettings(
  scene: THREE.Object3D,
  camera: THREE.Camera,
): void {
  if (this.domElement.id !== 'game-canvas') {
    originalRender.call(this, scene, camera)
    return
  }

  let state = rendererStates.get(this)
  if (!state) {
    state = { settingsVersion: 0, lastRenderedAt: 0 }
    rendererStates.set(this, state)
  }

  if (state.settingsVersion !== settingsVersion) {
    applyRendererSettings(this, scene, camera)
    state.settingsVersion = settingsVersion
  }

  const now = performance.now()
  const fpsLimit = fpsLimitAsNumber(currentSettings.fpsLimit)
  if (fpsLimit) {
    const interval = 1000 / fpsLimit
    const elapsed = now - state.lastRenderedAt
    if (state.lastRenderedAt > 0 && elapsed < interval - 0.25) return

    state.lastRenderedAt = currentSettings.vsync
      ? now - (elapsed % interval)
      : now
  } else {
    state.lastRenderedAt = now
  }

  originalRender.call(this, scene, camera)
}

function ensureCrosshair(): HTMLElement | undefined {
  const gameRoot = document.querySelector<HTMLElement>('#game-root')
  if (!gameRoot) return undefined

  let crosshair = gameRoot.querySelector<HTMLElement>('.game-crosshair')
  if (!crosshair) {
    crosshair = document.createElement('div')
    crosshair.className = 'game-crosshair'
    crosshair.setAttribute('aria-hidden', 'true')
    crosshair.innerHTML = '<span></span><i></i>'
    gameRoot.append(crosshair)
  }
  return crosshair
}

function updateCrosshair(settings: Readonly<GameSettingsSnapshot>): void {
  ensureCrosshair()?.classList.toggle('visible', settings.showCrosshair)
}

function actionCodes(settings: Readonly<GameSettingsSnapshot>): {
  roll: string
  camera: string
  newMatch: string
} {
  if (settings.keyBindings === 'Left Handed') {
    return { roll: 'Enter', camera: 'KeyM', newMatch: 'KeyB' }
  }

  if (settings.keyBindings === 'Custom') {
    return {
      roll: settings.customRollKey,
      camera: settings.customCameraKey,
      newMatch: settings.customNewMatchKey,
    }
  }

  return { roll: 'Space', camera: 'KeyC', newMatch: 'KeyN' }
}

function clickGameButton(selector: string): void {
  const button = document.querySelector<HTMLButtonElement>(selector)
  if (!button || button.disabled) return
  button.click()
}

window.addEventListener('keydown', (event) => {
  if (event.repeat || event.defaultPrevented) return
  const target = event.target
  if (
    target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
  ) return

  const fantasyUi = document.querySelector<HTMLElement>('.fantasy-ui')
  if (fantasyUi && !fantasyUi.classList.contains('hidden')) return

  const codes = actionCodes(currentSettings)
  if (event.code === codes.roll) {
    event.preventDefault()
    clickGameButton('#roll-button')
  } else if (event.code === codes.camera) {
    event.preventDefault()
    clickGameButton('#camera-button')
  } else if (event.code === codes.newMatch) {
    event.preventDefault()
    clickGameButton('#new-match-button')
  }
})

window.addEventListener('resize', () => {
  settingsVersion += 1
})

gameSettings.subscribe((settings) => {
  const nextGraphicsSignature = graphicsSignature(settings)
  if (nextGraphicsSignature !== currentGraphicsSignature) {
    currentGraphicsSignature = nextGraphicsSignature
    settingsVersion += 1
  }

  currentSettings = settings
  updateCrosshair(settings)
})
