import type { InventoryItem, PlayerState } from './types'

export const INVENTORY_SLOT_COUNT = 6

const ITEM_GLYPHS: Readonly<Record<string, string>> = {
  monk: '🙏',
  flashlight: '🔦',
  'jail-key': '🔑',
  pill: '💊',
  rope: '🪢',
  'fire-truck': '🚒',
  'treasure-key': '🗝️',
  'thunder-umbrella': '☂️',
  'bulletproof-vest': '🦺',
  parachute: '🪂',
  gun: '🔫',
  boat: '🛶',
  'energy-shield-boots': '🥾',
  'skip-card': '⏭️',
}

export function inventorySlotUsage(player: Pick<PlayerState, 'inventory'>): number {
  return Math.min(player.inventory.length, INVENTORY_SLOT_COUNT)
}

export function hasInventorySpaceFor(
  player: Pick<PlayerState, 'inventory'>,
  itemId: string,
): boolean {
  return player.inventory.some((item) => item.id === itemId)
    || player.inventory.length < INVENTORY_SLOT_COUNT
}

export function inventoryGlyph(item: Pick<InventoryItem, 'id'>): string {
  return ITEM_GLYPHS[item.id] ?? '🎒'
}
