import type { InventoryItem, PlayerState } from './types'

export type TileRuleTone = 'success' | 'warning' | 'danger' | 'info'

export interface TileResolution {
  tileNumber: number
  name: string
  message: string
  logMessage: string
  tone: TileRuleTone
  mapped: boolean
}

type ItemId =
  | 'monk'
  | 'flashlight'
  | 'key'
  | 'pill'
  | 'rope'
  | 'fire-truck'
  | 'treasure-key'

type BoardRule =
  | {
      kind: 'item'
      tileNumber: number
      name: string
      itemId: ItemId
      itemName: string
      cost: number
      maxQuantity: number
    }
  | {
      kind: 'money'
      tileNumber: number
      name: string
      amount: number
    }
  | {
      kind: 'danger'
      tileNumber: number
      name: string
      requiredItemId: ItemId
      requiredItemName: string
      damage: number
      consumeItem: boolean
    }
  | {
      kind: 'treasure'
      tileNumber: number
      name: string
      requiredItemId: ItemId
      requiredItemName: string
      amount: number
      consumeItem: boolean
    }
  | {
      kind: 'blank'
      tileNumber: number
      name: string
    }

const TREASURE_REWARD = 100_000

const BOARD_RULES: Readonly<Partial<Record<number, BoardRule>>> = {
  1: {
    kind: 'item',
    tileNumber: 1,
    name: 'Monk',
    itemId: 'monk',
    itemName: 'Monk',
    cost: 0,
    maxQuantity: 1,
  },
  2: {
    kind: 'item',
    tileNumber: 2,
    name: 'Flashlight',
    itemId: 'flashlight',
    itemName: 'Flashlight',
    cost: 500,
    maxQuantity: 1,
  },
  3: {
    kind: 'item',
    tileNumber: 3,
    name: 'Key',
    itemId: 'key',
    itemName: 'Key',
    cost: 0,
    maxQuantity: 2,
  },
  4: {
    kind: 'item',
    tileNumber: 4,
    name: 'Pill',
    itemId: 'pill',
    itemName: 'Pill',
    cost: 200,
    maxQuantity: 3,
  },
  5: {
    kind: 'item',
    tileNumber: 5,
    name: 'Rope',
    itemId: 'rope',
    itemName: 'Rope',
    cost: 0,
    maxQuantity: 1,
  },
  6: {
    kind: 'item',
    tileNumber: 6,
    name: 'Fire Fighter Car',
    itemId: 'fire-truck',
    itemName: 'Fire Fighter Car',
    cost: 0,
    maxQuantity: 1,
  },
  7: {
    kind: 'money',
    tileNumber: 7,
    name: 'Diamond',
    amount: 30_000,
  },
  8: {
    kind: 'danger',
    tileNumber: 8,
    name: 'Lost in the Dark',
    requiredItemId: 'flashlight',
    requiredItemName: 'Flashlight',
    damage: 1,
    consumeItem: true,
  },
  11: {
    kind: 'item',
    tileNumber: 11,
    name: 'Treasure Key',
    itemId: 'treasure-key',
    itemName: 'Treasure Key',
    cost: 0,
    maxQuantity: 2,
  },
  12: {
    kind: 'danger',
    tileNumber: 12,
    name: 'Stomach Trouble',
    requiredItemId: 'pill',
    requiredItemName: 'Pill',
    damage: 1,
    consumeItem: true,
  },
  13: {
    kind: 'danger',
    tileNumber: 13,
    name: 'Jail',
    requiredItemId: 'key',
    requiredItemName: 'Key',
    damage: 1,
    consumeItem: true,
  },
  14: {
    kind: 'danger',
    tileNumber: 14,
    name: 'House Fire',
    requiredItemId: 'fire-truck',
    requiredItemName: 'Fire Fighter Car',
    damage: 1,
    consumeItem: true,
  },
  15: {
    kind: 'blank',
    tileNumber: 15,
    name: 'Blank Tile',
  },
  16: {
    kind: 'danger',
    tileNumber: 16,
    name: 'Walk Down the Drain',
    requiredItemId: 'rope',
    requiredItemName: 'Rope',
    damage: 1,
    consumeItem: true,
  },
  17: {
    kind: 'treasure',
    tileNumber: 17,
    name: 'Treasure',
    requiredItemId: 'treasure-key',
    requiredItemName: 'Treasure Key',
    amount: TREASURE_REWARD,
    consumeItem: true,
  },
}

function formatMoney(value: number): string {
  return `$${new Intl.NumberFormat('en-US').format(value)}`
}

function findInventoryItem(player: PlayerState, itemId: string): InventoryItem | undefined {
  return player.inventory.find((item) => item.id === itemId)
}

function addInventoryItem(player: PlayerState, itemId: string, itemName: string): number {
  const existing = findInventoryItem(player, itemId)
  if (existing) {
    existing.quantity += 1
    return existing.quantity
  }

  player.inventory.push({ id: itemId, name: itemName, quantity: 1 })
  return 1
}

function consumeInventoryItem(player: PlayerState, itemId: string): boolean {
  const itemIndex = player.inventory.findIndex((item) => item.id === itemId)
  if (itemIndex < 0) return false

  const item = player.inventory[itemIndex]
  if (item.quantity <= 0) return false

  item.quantity -= 1
  if (item.quantity === 0) player.inventory.splice(itemIndex, 1)
  return true
}

function resolveItemRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'item' }>): TileResolution {
  const currentQuantity = findInventoryItem(player, rule.itemId)?.quantity ?? 0

  if (currentQuantity >= rule.maxQuantity) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `You already carry the maximum ${rule.itemName} quantity (${rule.maxQuantity}).`,
      logMessage: `🎒 ${player.name} already has the maximum ${rule.itemName} quantity`,
      tone: 'info',
      mapped: true,
    }
  }

  if (rule.cost > player.money) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `${rule.itemName} costs ${formatMoney(rule.cost)}, but you only have ${formatMoney(player.money)}.`,
      logMessage: `💸 ${player.name} could not afford ${rule.itemName}`,
      tone: 'warning',
      mapped: true,
    }
  }

  player.money -= rule.cost
  const quantity = addInventoryItem(player, rule.itemId, rule.itemName)
  const costText = rule.cost > 0 ? ` for ${formatMoney(rule.cost)}` : ' for free'

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `Received ${rule.itemName} ×1${costText}. You now carry ${quantity}/${rule.maxQuantity}.`,
    logMessage: `🎒 ${player.name} received ${rule.itemName} ×1${costText}`,
    tone: 'success',
    mapped: true,
  }
}

function resolveMoneyRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'money' }>): TileResolution {
  player.money += rule.amount

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `Lucky find! You received ${formatMoney(rule.amount)}.`,
    logMessage: `💎 ${player.name} gained ${formatMoney(rule.amount)} from ${rule.name}`,
    tone: 'success',
    mapped: true,
  }
}

function resolveDangerRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'danger' }>): TileResolution {
  const protectedPlayer = findInventoryItem(player, rule.requiredItemId)?.quantity

  if (protectedPlayer) {
    if (rule.consumeItem) consumeInventoryItem(player, rule.requiredItemId)
    const consumedText = rule.consumeItem ? ' It was consumed.' : ''

    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `${rule.requiredItemName} protected you from ${rule.name}.${consumedText}`,
      logMessage: `🛡️ ${player.name} used ${rule.requiredItemName} and survived ${rule.name}`,
      tone: 'success',
      mapped: true,
    }
  }

  player.hearts = Math.max(0, player.hearts - rule.damage)

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `No ${rule.requiredItemName}! You lost ${rule.damage} heart and have ${player.hearts}/${player.maxHearts} left.`,
    logMessage: `💔 ${player.name} had no ${rule.requiredItemName} and lost ${rule.damage} heart on ${rule.name}`,
    tone: player.hearts === 0 ? 'danger' : 'warning',
    mapped: true,
  }
}

function resolveTreasureRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'treasure' }>): TileResolution {
  const hasKey = findInventoryItem(player, rule.requiredItemId)?.quantity

  if (!hasKey) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `The treasure is locked. You need a ${rule.requiredItemName} to claim it.`,
      logMessage: `🔒 ${player.name} found Treasure but had no ${rule.requiredItemName}`,
      tone: 'warning',
      mapped: true,
    }
  }

  if (rule.consumeItem) consumeInventoryItem(player, rule.requiredItemId)
  player.money += rule.amount

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `Treasure opened! You received ${formatMoney(rule.amount)}.`,
    logMessage: `🧰 ${player.name} opened Treasure and gained ${formatMoney(rule.amount)}`,
    tone: 'success',
    mapped: true,
  }
}

export function resolveBoardTile(player: PlayerState, tileNumber: number): TileResolution {
  const rule = BOARD_RULES[tileNumber]

  if (!rule) {
    return {
      tileNumber,
      name: `Tile ${tileNumber}`,
      message: 'This tile rule has not been mapped yet.',
      logMessage: `📍 ${player.name} landed on Tile ${tileNumber} — rule not mapped yet`,
      tone: 'info',
      mapped: false,
    }
  }

  switch (rule.kind) {
    case 'item':
      return resolveItemRule(player, rule)
    case 'money':
      return resolveMoneyRule(player, rule)
    case 'danger':
      return resolveDangerRule(player, rule)
    case 'treasure':
      return resolveTreasureRule(player, rule)
    case 'blank':
      return {
        tileNumber,
        name: rule.name,
        message: 'Nothing happens on this tile.',
        logMessage: `⬜ ${player.name} landed on the blank Tile ${tileNumber}`,
        tone: 'info',
        mapped: true,
      }
  }
}

export function getMappedRuleCount(): number {
  return Object.keys(BOARD_RULES).length
}
