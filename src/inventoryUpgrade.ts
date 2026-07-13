import '../styles/inventory-slots.css'
import { INVENTORY_SLOT_COUNT } from './game/inventory'

interface VisibleInventoryItem {
  name: string
  quantity: number
}

const ITEM_GLYPHS: Readonly<Record<string, string>> = {
  monk: '🙏',
  flashlight: '🔦',
  'jail key': '🔑',
  pill: '💊',
  rope: '🪢',
  'fire fighter car': '🚒',
  'treasure key': '🗝️',
  'thunder umbrella': '☂️',
  'bulletproof vest': '🦺',
  parachute: '🪂',
  gun: '🔫',
  boat: '🛶',
  'energy shield boots': '🥾',
  'skip card': '⏭️',
}

function iconFor(name: string): string {
  return ITEM_GLYPHS[name.trim().toLowerCase()] ?? '🎒'
}

function readRawItems(container: HTMLElement): VisibleInventoryItem[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.inventory-item')).map((element) => {
    const name = element.querySelector('strong')?.textContent?.trim() || 'Item'
    const quantityText = element.querySelector('span')?.textContent ?? '1'
    const quantity = Math.max(1, Number(quantityText.replace(/[^0-9]/g, '')) || 1)
    return { name, quantity }
  })
}

function createSlot(item: VisibleInventoryItem | undefined, slotIndex: number): HTMLElement {
  const slot = document.createElement('div')
  slot.className = `inventory-slot ${item ? 'filled' : 'empty'}`
  slot.setAttribute('role', 'listitem')
  slot.setAttribute('aria-label', item
    ? `Slot ${slotIndex + 1}: ${item.name}, quantity ${item.quantity}`
    : `Slot ${slotIndex + 1}: empty`)

  if (!item) {
    slot.innerHTML = '<span class="inventory-empty-plus" aria-hidden="true">+</span>'
    return slot
  }

  slot.title = `${item.name} ×${item.quantity}`
  slot.innerHTML = `
    <span class="inventory-slot-icon" aria-hidden="true">${iconFor(item.name)}</span>
    ${item.quantity > 1 ? `<strong class="inventory-slot-quantity">×${item.quantity}</strong>` : ''}
  `
  return slot
}

function upgradeInventory(container: HTMLElement): void {
  if (container.querySelector('[data-fixed-inventory="true"]')) return

  const items = readRawItems(container).slice(0, INVENTORY_SLOT_COUNT)
  const hasRawInventoryMarkup = container.querySelector('.inventory-item, .inventory-empty, .inventory-slots')
  if (!hasRawInventoryMarkup) return

  const wrapper = document.createElement('div')
  wrapper.dataset.fixedInventory = 'true'
  wrapper.className = 'fixed-inventory'

  const copy = document.createElement('div')
  copy.className = 'inventory-capacity-copy'
  copy.innerHTML = items.length === 0
    ? '<span>No items yet. Land on an item tile to collect protection.</span><strong>0/6 slots</strong>'
    : `<span>Unique items use one slot. Matching items stack together.</span><strong>${items.length}/${INVENTORY_SLOT_COUNT} slots</strong>`

  const grid = document.createElement('div')
  grid.className = 'inventory-slot-grid'
  grid.setAttribute('role', 'list')
  grid.setAttribute('aria-label', `${INVENTORY_SLOT_COUNT}-slot private inventory`)

  for (let index = 0; index < INVENTORY_SLOT_COUNT; index += 1) {
    grid.append(createSlot(items[index], index))
  }

  wrapper.append(copy, grid)
  container.replaceChildren(wrapper)

  const privacyNote = container.closest('.inventory-panel')?.querySelector<HTMLElement>('.privacy-note')
  if (privacyNote) {
    privacyNote.textContent = 'Hot-seat preview: 6 unique item slots; matching items stack in one slot.'
  }
}

function startInventoryUpgrade(): void {
  const inventory = document.querySelector<HTMLElement>('#inventory-items')
  if (!inventory) return

  upgradeInventory(inventory)

  const observer = new MutationObserver(() => {
    queueMicrotask(() => upgradeInventory(inventory))
  })
  observer.observe(inventory, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInventoryUpgrade, { once: true })
} else {
  startInventoryUpgrade()
}
