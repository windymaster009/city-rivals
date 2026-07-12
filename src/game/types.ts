import type * as THREE from 'three'

export interface InventoryItem {
  id: string
  name: string
  quantity: number
}

export interface PlayerState {
  id: string
  seatIndex: number
  name: string
  hearts: number
  maxHearts: number
  money: number
  inventory: InventoryItem[]
  tileIndex: number
  laps: number
  accent: number
  model: THREE.Group
  eliminated: boolean
}

export type CameraMode = 'board' | 'focus' | 'follow'
