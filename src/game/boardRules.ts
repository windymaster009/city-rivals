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
  | 'jail-key'
  | 'pill'
  | 'rope'
  | 'fire-truck'
  | 'treasure-key'
  | 'thunder-umbrella'
  | 'bulletproof-vest'
  | 'parachute'
  | 'gun'
  | 'boat'
  | 'energy-shield-boots'
  | 'skip-card'

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
      kind: 'heal'
      tileNumber: number
      name: string
      cost: number
      hearts: number
    }
  | {
      kind: 'blank'
      tileNumber: number
      name: string
    }
  | {
      kind: 'robbery'
      tileNumber: number
      name: string
      demandedAmount: number
      gunItemId: ItemId
      vestItemId: ItemId
    }
  | {
      kind: 'duel'
      tileNumber: number
      name: string
      gunItemId: ItemId
      vestItemId: ItemId
      damage: number
    }
  | {
      kind: 'transfer'
      tileNumber: number
      name: string
      amount: number
      recipientSeatIndex: number
    }
  | {
      kind: 'money-loss'
      tileNumber: number
      name: string
      amount: number
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
    name: 'Jail Key',
    itemId: 'jail-key',
    itemName: 'Jail Key',
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

  9: {
    kind: 'item',
    tileNumber: 9,
    name: 'Treasure Key',
    itemId: 'treasure-key',
    itemName: 'Treasure Key',
    cost: 0,
    maxQuantity: 2,
  },

  10: {
    kind: 'danger',
    tileNumber: 10,
    name: 'Diarrhea',
    requiredItemId: 'pill',
    requiredItemName: 'Pill',
    damage: 1,
    consumeItem: true,
  },

  11: {
    kind: 'danger',
    tileNumber: 11,
    name: 'Prison Time',
    requiredItemId: 'jail-key',
    requiredItemName: 'Jail Key',
    damage: 1,
    consumeItem: true,
  },
  12: {
    kind: 'danger',
    tileNumber: 12,
    name: 'House on Fire',
    requiredItemId: 'fire-truck',
    requiredItemName: 'Fire Fighter Car',
    damage: 1,
    consumeItem: true,
  },
  13: {
    kind: 'blank',
    tileNumber: 13,
    name: 'Skip',
  },
  14: {
    kind: 'danger',
    tileNumber: 14,
    name: 'Fall Down the Drain',
    requiredItemId: 'rope',
    requiredItemName: 'Rope',
    damage: 1,
    consumeItem: true,
  },
  15: {
    kind: 'treasure',
    tileNumber: 15,
    name: 'Found Treasure',
    requiredItemId: 'treasure-key',
    requiredItemName: 'Treasure Key',
    amount: TREASURE_REWARD,
    consumeItem: true,
  },
  16: {
    kind: 'heal',
    tileNumber: 16,
    name: 'Heart Recovery',
    cost: 20_000,
    hearts: 2,
  },
  17: {
    kind: 'item',
    tileNumber: 17,
    name: 'Thunder Umbrella',
    itemId: 'thunder-umbrella',
    itemName: 'Thunder Umbrella',
    cost: 500,
    maxQuantity: 1,
  },
  18: {
    kind: 'robbery',
    tileNumber: 18,
    name: 'Armed Robbery',
    demandedAmount: 100_000,
    gunItemId: 'gun',
    vestItemId: 'bulletproof-vest',
  },
  19: {
    kind: 'money',
    tileNumber: 19,
    name: 'Lottery Win',
    amount: 100_000,
  },
  20: {
    kind: 'item',
    tileNumber: 20,
    name: 'Parachute',
    itemId: 'parachute',
    itemName: 'Parachute',
    cost: 1_000,
    maxQuantity: 1,
  },
  21: {
    kind: 'item',
    tileNumber: 21,
    name: 'Gun',
    itemId: 'gun',
    itemName: 'Gun',
    cost: 900,
    maxQuantity: 1,
  },
  22: {
    kind: 'item',
    tileNumber: 22,
    name: 'Boat',
    itemId: 'boat',
    itemName: 'Boat',
    cost: 5_000,
    maxQuantity: 1,
  },
  23: {
    kind: 'duel',
    tileNumber: 23,
    name: 'Duel',
    gunItemId: 'gun',
    vestItemId: 'bulletproof-vest',
    damage: 1,
  },
  24: {
    kind: 'transfer',
    tileNumber: 24,
    name: 'Accidental Transfer',
    amount: 2_000,
    recipientSeatIndex: 1,
  },
  25: {
    kind: 'danger',
    tileNumber: 25,
    name: 'Landmine',
    requiredItemId: 'energy-shield-boots',
    requiredItemName: 'Energy Shield Boots',
    damage: 1,
    consumeItem: true,
  },
  26: {
    kind: 'item',
    tileNumber: 26,
    name: 'Boat',
    itemId: 'boat',
    itemName: 'Boat',
    cost: 5_000,
    maxQuantity: 1,
  },
  27: {
    kind: 'money-loss',
    tileNumber: 27,
    name: 'Lost Money',
    amount: 500,
  },
  28: {
    kind: 'item',
    tileNumber: 28,
    name: 'Thunder Umbrella',
    itemId: 'thunder-umbrella',
    itemName: 'Thunder Umbrella',
    cost: 500,
    maxQuantity: 1,
  },
  29: {
    kind: 'danger',
    tileNumber: 29,
    name: 'Struck by Lightning',
    requiredItemId: 'thunder-umbrella',
    requiredItemName: 'Thunder Umbrella',
    damage: 1,
    consumeItem: true,
  },
  30: {
    kind: 'item',
    tileNumber: 30,
    name: 'Skip Card',
    itemId: 'skip-card',
    itemName: 'Skip Card',
    cost: 0,
    maxQuantity: 1,
  },
  31: {
    kind: 'money-loss',
    tileNumber: 31,
    name: 'Lost Lottery',
    amount: 900_000,
  },
  32: {
    kind: 'item',
    tileNumber: 32,
    name: 'Bulletproof Vest',
    itemId: 'bulletproof-vest',
    itemName: 'Bulletproof Vest',
    cost: 500,
    maxQuantity: 1,
  },
  33: {
    kind: 'danger',
    tileNumber: 33,
    name: 'Plane Crash',
    requiredItemId: 'parachute',
    requiredItemName: 'Parachute',
    damage: 1,
    consumeItem: true,
  },
  34: {
    kind: 'money',
    tileNumber: 34,
    name: 'Tournament Win',
    amount: 5_000,
  },
  35: {
    kind: 'item',
    tileNumber: 35,
    name: 'Energy Shield Boots',
    itemId: 'energy-shield-boots',
    itemName: 'Energy Shield Boots',
    cost: 3_000,
    maxQuantity: 1,
  },
  36: {
    kind: 'danger',
    tileNumber: 36,
    name: 'Fall Down the Drain',
    requiredItemId: 'rope',
    requiredItemName: 'Rope',
    damage: 1,
    consumeItem: true,
  },
  37: {
    kind: 'money-loss',
    tileNumber: 37,
    name: 'Lost Money',
    amount: 300,
  },
  38: {
    kind: 'heal',
    tileNumber: 38,
    name: 'Heart Recovery',
    cost: 30_000,
    hearts: 3,
  },
  39: {
    kind: 'danger',
    tileNumber: 39,
    name: 'Prison Time',
    requiredItemId: 'jail-key',
    requiredItemName: 'Jail Key',
    damage: 1,
    consumeItem: true,
  },
}

export type BoardTileDecision = 'pay' | 'refuse'

export interface BoardTileChoice {
  title: string
  message: string
  options: ReadonlyArray<{
    value: BoardTileDecision
    label: string
    className: string
  }>
}

export interface BoardRuleContext {
  players: readonly PlayerState[]
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

function resolveHealRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'heal' }>): TileResolution {
  if (player.hearts >= player.maxHearts) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: 'Your hearts are already full.',
      logMessage: `${player.name} found ${rule.name}, but already had full hearts`,
      tone: 'info',
      mapped: true,
    }
  }

  if (rule.cost > player.money) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `${rule.name} costs ${formatMoney(rule.cost)}, but you only have ${formatMoney(player.money)}.`,
      logMessage: `${player.name} could not afford ${rule.name}`,
      tone: 'warning',
      mapped: true,
    }
  }

  player.money -= rule.cost
  const previousHearts = player.hearts
  player.hearts = Math.min(player.maxHearts, player.hearts + rule.hearts)
  const healed = player.hearts - previousHearts

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `Paid ${formatMoney(rule.cost)} and recovered ${healed} heart${healed === 1 ? '' : 's'}.`,
    logMessage: `${player.name} paid ${formatMoney(rule.cost)} and recovered ${healed} heart${healed === 1 ? '' : 's'}`,
    tone: 'success',
    mapped: true,
  }
}

function resolveRobberyRule(
  player: PlayerState,
  rule: Extract<BoardRule, { kind: 'robbery' }>,
  decision?: BoardTileDecision,
): TileResolution {
  const canPay = player.money >= rule.demandedAmount

  if (canPay && decision === 'pay') {
    player.money = Math.max(0, player.money - rule.demandedAmount)
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `You paid the robber ${formatMoney(rule.demandedAmount)} and survived.`,
      logMessage: `${player.name} paid the robber ${formatMoney(rule.demandedAmount)} and survived`,
      tone: 'warning',
      mapped: true,
    }
  }

  if (consumeInventoryItem(player, rule.gunItemId)) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: `You used your Gun to stop the robber. Your money is safe, but the Gun is gone.`,
      logMessage: `${player.name} used a Gun to stop the robber and kept all their money`,
      tone: 'success',
      mapped: true,
    }
  }

  if (findInventoryItem(player, rule.vestItemId)?.quantity) {
    consumeInventoryItem(player, rule.vestItemId)
    if (canPay) player.money = Math.max(0, player.money - rule.demandedAmount)

    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: canPay
        ? `Your Bulletproof Vest stopped the shot and was consumed. The robber still took ${formatMoney(rule.demandedAmount)}.`
        : `Your Bulletproof Vest stopped the shot and was consumed. Your money is unchanged.`,
      logMessage: canPay
        ? `${player.name}'s Bulletproof Vest stopped the shot, but the robber took ${formatMoney(rule.demandedAmount)}`
        : `${player.name}'s Bulletproof Vest stopped the robber's shot`,
      tone: canPay ? 'warning' : 'success',
      mapped: true,
    }
  }

  player.hearts = Math.max(0, player.hearts - 1)
  if (!canPay) player.money = 0

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: canPay
      ? `You refused to pay and were shot. You lost 1 life, but your money is unchanged.`
      : `You could not pay and were shot. You lost 1 life and your money is now $0.`,
    logMessage: `${player.name} had no protection and lost 1 life during ${rule.name}`,
    tone: player.hearts === 0 ? 'danger' : 'warning',
    mapped: true,
  }
}

function resolveDuelRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'duel' }>): TileResolution {
  const hasGun = Boolean(findInventoryItem(player, rule.gunItemId)?.quantity)
  const hasVest = Boolean(findInventoryItem(player, rule.vestItemId)?.quantity)

  if (hasGun) consumeInventoryItem(player, rule.gunItemId)
  if (hasVest) consumeInventoryItem(player, rule.vestItemId)

  if (hasGun && hasVest) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: 'Your Gun and Bulletproof Vest protected you in the duel. Both items were consumed.',
      logMessage: `${player.name} used a Gun and Bulletproof Vest to survive the duel without losing a life`,
      tone: 'success',
      mapped: true,
    }
  }

  player.hearts = Math.max(0, player.hearts - rule.damage)
  const lostItem = hasGun ? 'Gun' : hasVest ? 'Bulletproof Vest' : null

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: lostItem
      ? `A ${lostItem} alone was not enough. It was consumed and you lost ${rule.damage} life.`
      : `You had no Gun or Bulletproof Vest and lost ${rule.damage} life.`,
    logMessage: `${player.name} lacked both duel items and lost ${rule.damage} life`,
    tone: player.hearts === 0 ? 'danger' : 'warning',
    mapped: true,
  }
}

function resolveTransferRule(
  player: PlayerState,
  rule: Extract<BoardRule, { kind: 'transfer' }>,
  context?: BoardRuleContext,
): TileResolution {
  const recipient = context?.players.find((candidate) => candidate.seatIndex === rule.recipientSeatIndex)

  if (!recipient || recipient.id === player.id) {
    return {
      tileNumber: rule.tileNumber,
      name: rule.name,
      message: recipient ? 'You are Player 2, so no money was transferred.' : 'Player 2 is not in this match.',
      logMessage: `${player.name} landed on ${rule.name}, but no transfer was needed`,
      tone: 'info',
      mapped: true,
    }
  }

  const transferredAmount = Math.min(player.money, rule.amount)
  player.money = Math.max(0, player.money - transferredAmount)
  recipient.money += transferredAmount

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `You accidentally sent ${formatMoney(transferredAmount)} to ${recipient.name}.`,
    logMessage: `${player.name} accidentally sent ${formatMoney(transferredAmount)} to ${recipient.name}`,
    tone: 'warning',
    mapped: true,
  }
}

function resolveMoneyLossRule(player: PlayerState, rule: Extract<BoardRule, { kind: 'money-loss' }>): TileResolution {
  const lostAmount = Math.min(player.money, rule.amount)
  player.money = Math.max(0, player.money - rule.amount)

  return {
    tileNumber: rule.tileNumber,
    name: rule.name,
    message: `You lost ${formatMoney(lostAmount)}.`,
    logMessage: `${player.name} lost ${formatMoney(lostAmount)} on ${rule.name}`,
    tone: 'warning',
    mapped: true,
  }
}

export function getBoardTileChoice(player: PlayerState, tileNumber: number): BoardTileChoice | null {
  const rule = BOARD_RULES[tileNumber]
  if (rule?.kind !== 'robbery' || player.money < rule.demandedAmount) return null

  return {
    title: rule.name,
    message: `The robber demands ${formatMoney(rule.demandedAmount)}. Pay or refuse and defend yourself?`,
    options: [
      { value: 'pay', label: `Pay ${formatMoney(rule.demandedAmount)}`, className: 'rpg-button-orange' },
      { value: 'refuse', label: 'Refuse', className: 'rpg-button-red' },
    ],
  }
}

export function resolveBoardTile(
  player: PlayerState,
  tileNumber: number,
  decision?: BoardTileDecision,
  context?: BoardRuleContext,
): TileResolution {
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
    case 'heal':
      return resolveHealRule(player, rule)
    case 'robbery':
      return resolveRobberyRule(player, rule, decision)
    case 'duel':
      return resolveDuelRule(player, rule)
    case 'transfer':
      return resolveTransferRule(player, rule, context)
    case 'money-loss':
      return resolveMoneyLossRule(player, rule)
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
