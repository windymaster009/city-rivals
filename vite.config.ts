import { defineConfig, type Plugin } from 'vite'

function inventoryCapacityPlugin(): Plugin {
  return {
    name: 'city-rivals-inventory-capacity',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?', 1)[0].replaceAll('\\', '/')
      if (!cleanId.endsWith('/src/game/boardRules.ts')) return null

      const importAnchor = "import type { InventoryItem, PlayerState } from './types'\n"
      const quantityAnchor = '  const currentQuantity = findInventoryItem(player, rule.itemId)?.quantity ?? 0\n'

      if (!code.includes(importAnchor) || !code.includes(quantityAnchor)) {
        this.error('Inventory capacity patch could not find the expected board-rule anchors.')
      }

      const inventoryImport = "import { INVENTORY_SLOT_COUNT, hasInventorySpaceFor } from './inventory'\n"
      const capacityGuard = `\n  if (!hasInventorySpaceFor(player, rule.itemId)) {\n    return {\n      tileNumber: rule.tileNumber,\n      name: rule.name,\n      message: \`Inventory full (\${INVENTORY_SLOT_COUNT}/\${INVENTORY_SLOT_COUNT} slots). \${rule.itemName} was left behind and you were not charged.\`,\n      logMessage: \`🎒 \${player.name} could not collect \${rule.itemName} because their inventory is full\`,\n      tone: 'warning',\n      mapped: true,\n    }\n  }\n`

      return {
        code: code
          .replace(importAnchor, `${importAnchor}${inventoryImport}`)
          .replace(quantityAnchor, `${quantityAnchor}${capacityGuard}`),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [inventoryCapacityPlugin()],
})
