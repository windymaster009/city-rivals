import * as THREE from 'three'
import type { CameraMode } from './types'

export class CameraController {
  private readonly camera: THREE.PerspectiveCamera
  private mode: CameraMode = 'board'
  private focusTarget = new THREE.Vector3()
  private followTarget?: THREE.Object3D
  private boardPosition = new THREE.Vector3(16, 18, 18)
  private desiredPosition = new THREE.Vector3()
  private desiredLookAt = new THREE.Vector3()
  private currentLookAt = new THREE.Vector3()
  private lastMoveDirection = new THREE.Vector3(0, 0, -1)

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    camera.position.copy(this.boardPosition)
    this.currentLookAt.set(0, 0, 0)
    camera.lookAt(this.currentLookAt)
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

  update(delta: number): void {
    const smooth = 1 - Math.exp(-delta * 4.2)
    const lookSmooth = 1 - Math.exp(-delta * 6)

    if (this.mode === 'board') {
      this.desiredPosition.copy(this.boardPosition)
      this.desiredLookAt.set(0, 0.4, 0)
    } else if (this.mode === 'focus') {
      this.desiredPosition.copy(this.focusTarget).add(new THREE.Vector3(5.5, 7.2, 6.5))
      this.desiredLookAt.copy(this.focusTarget).add(new THREE.Vector3(0, 0.8, 0))
    } else if (this.followTarget) {
      const horizontalTarget = this.followTarget.position.clone()
      horizontalTarget.y = 0

      const behind = this.lastMoveDirection.clone().multiplyScalar(-6.2)
      const side = new THREE.Vector3(-this.lastMoveDirection.z, 0, this.lastMoveDirection.x).multiplyScalar(1.4)
      this.desiredPosition.copy(horizontalTarget).add(behind).add(side)
      this.desiredPosition.y = 6.2
      this.desiredLookAt.copy(horizontalTarget).add(new THREE.Vector3(0, 1.05, 0))
    }

    this.camera.position.lerp(this.desiredPosition, smooth)
    this.currentLookAt.lerp(this.desiredLookAt, lookSmooth)
    this.camera.lookAt(this.currentLookAt)
  }
}
