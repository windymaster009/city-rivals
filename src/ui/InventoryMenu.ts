import { createElement, panelShell } from './dom'

export class InventoryMenu {
  readonly element = panelShell('Inventory', 'inventory-menu-panel')
  private readonly slots = createElement('div', 'inventory-grid')

  constructor() {
    this.element.append(this.slots)
    this.renderEmpty()
  }

  renderEmpty(): void {
    this.slots.replaceChildren()
    for (let index = 0; index < 12; index += 1) {
      const slot = createElement('button', 'inventory-slot')
      slot.type = 'button'
      slot.setAttribute('aria-label', `Inventory slot ${index + 1}`)
      this.slots.append(slot)
    }
  }
}
