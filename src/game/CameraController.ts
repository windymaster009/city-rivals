import * as THREE from 'three'
import { gameSettings } from '../settings/GameSettings'
import type { CameraMode } from './types'

export class CameraController {
  private readonly camera: THREE.PerspectiveCamera
  private mode: CameraMode = 'board'
  private focusTarget = new THREE.Vector3()
  private followTarget?: THREE.Object3D
  private desiredPosition = new THREE.Vector3()
  private desiredLookAt = new THREE.Vector3()
  private currentLookAt = new THREE.Vector3()
  private lastMoveDirection = new THREE.Vector3(-1, 0, 0)
  private boardYaw = 0
  private boardPitch = 0.75
  private distanceScale = 1
  private draggingPointerId?: number
  private lastPointerX = 0
  private lastPointerY = 0

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.applyBoardPosition(camera.position)
    this.currentLookAt.set(0, 0, 0)
    camera.lookAt(this.currentLookAt)

    gameSettings.subscribe((settings) => this.setDistance(settings.cameraDistance))
    this.bindBoardCameraInput()
    window.addEventListener('city-rivals:reset-camera', () => this.resetBoardOrbit())
  }

  setBoardView(): void {
    this.mode = 'board'
    this.followTarget = undefined
  }

  focusOn(target: THREE.Vector3): void {
    this.mode = 'focus'
    this.focusTarget.copy(target)
    this.followTarget = undefined
  }

  follow(target: THREE.Object3D, direction?: THREE.Vector3): void {
    this.mode = 'follow'
    this.followTarget = target
    if (direction && direction.lengthSq() > 0.001) this.lastMoveDirection.copy(direction).normalize()
  }

  updateDirection(direction: THREE.Vector3): void {
    if (direction.lengthSq() > 0.001) this.lastMoveDirection.copy(direction).normalize()
  }

  getMode(): CameraMode {
    return this.mode
  }

  setDistance(value: number): void {
    const normalized = THREE.MathUtils.clamp(value, 1, 100) / 100
    this.distanceScale = THREE.MathUtils.lerp(0.72, 1.45, normalized)
  }

  orbitBoard(deltaX: number, deltaY: number, sensitivity: number, invertMouse: boolean): void {
    if (this.mode !== 'board') return

    const speed = THREE.MathUtils.lerp(0.0012, 0.006, THREE.MathUtils.clamp(sensitivity, 1, 100) / 100)
    this.boardYaw -= deltaX * speed
    const verticalDirection = invertMouse ? -1 : 1
    this.boardPitch = THREE.MathUtils.clamp(
      this.boardPitch + deltaY * speed * verticalDirection,
      0.38,
      1.32,
    )
  }

  resetBoardOrbit(): void {
    this.boardYaw = 0
    this.boardPitch = 0.75
  }

  update(delta: number): void {
    const smooth = 1 - Math.exp(-delta * 4.2)
    const lookSmooth = 1 - Math.exp(-delta * 6)

    if (this.mode === 'board') {
      this.applyBoardPosition(this.desiredPosition)
      this.desiredLookAt.set(0, 0.25, 0)
    } else if (this.mode === 'focus') {
      const offset = new THREE.Vector3(4.6, 6.5, 5.7).multiplyScalar(this.distanceScale)
      this.desiredPosition.copy(this.focusTarget).add(offset)
      this.desiredLookAt.copy(this.focusTarget).add(new THREE.Vector3(0, 0.75, 0))
    } else if (this.followTarget) {
      const horizontalTarget = this.followTarget.position.clone()
      horizontalTarget.y = 0

      const behind = this.lastMoveDirection.clone().multiplyScalar(-5.3 * this.distanceScale)
      const side = new THREE.Vector3(-this.lastMoveDirection.z, 0, this.lastMoveDirection.x)
        .multiplyScalar(1.15 * this.distanceScale)
      this.desiredPosition.copy(horizontalTarget).add(behind).add(side)
      this.desiredPosition.y = 5.7 * this.distanceScale
      this.desiredLookAt.copy(horizontalTarget).add(new THREE.Vector3(0, 0.9, 0))
    }

    this.camera.position.lerp(this.desiredPosition, smooth)
    this.currentLookAt.lerp(this.desiredLookAt, lookSmooth)
    this.camera.lookAt(this.currentLookAt)
  }

  private bindBoardCameraInput(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')
    if (!canvas) return

    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || this.mode !== 'board') return
      this.draggingPointerId = event.pointerId
      this.lastPointerX = event.clientX
      this.lastPointerY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('camera-dragging')
    })

    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.draggingPointerId) return

      const deltaX = event.clientX - this.lastPointerX
      const deltaY = event.clientY - this.lastPointerY
      this.lastPointerX = event.clientX
      this.lastPointerY = event.clientY

      const settings = gameSettings.get()
      this.orbitBoard(deltaX, deltaY, settings.mouseSensitivity, settings.invertMouse)
    })

    const finishDrag = (event: PointerEvent): void => {
      if (event.pointerId !== this.draggingPointerId) return
      this.draggingPointerId = undefined
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.classList.remove('camera-dragging')
    }

    canvas.addEventListener('pointerup', finishDrag)
    canvas.addEventListener('pointercancel', finishDrag)
    canvas.addEventListener('dblclick', () => {
      if (this.mode === 'board') this.resetBoardOrbit()
    })

    canvas.addEventListener('wheel', (event) => {
      if (this.mode !== 'board') return
      event.preventDefault()
      const current = gameSettings.get().cameraDistance
      const next = THREE.MathUtils.clamp(current + Math.sign(event.deltaY) * 4, 1, 100)
      gameSettings.set('cameraDistance', next)
    }, { passive: false })
  }

  private applyBoardPosition(target: THREE.Vector3): void {
    const radius = 32.2 * this.distanceScale
    const horizontalRadius = Math.cos(this.boardPitch) * radius
    target.set(
      Math.sin(this.boardYaw) * horizontalRadius,
      Math.sin(this.boardPitch) * radius,
      Math.cos(this.boardYaw) * horizontalRadius,
    )
  }
}
