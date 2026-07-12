import type * as THREE from 'three'

export type PlayerId = 'windy' | 'rival'

export interface PlayerState {
  id: PlayerId
  name: string
  money: number
  health: number
  properties: number
  tileIndex: number
  accent: number
  model: THREE.Group
}

export type CameraMode = 'board' | 'focus' | 'follow'
