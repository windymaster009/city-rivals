import { createButton, createElement, escapeHtml, panelShell } from './dom'
import type { ChatMessage, LobbyPlayer } from './types'

export class LobbyMenu {
  readonly element = panelShell('Lobby', 'lobby-panel')
  private readonly players = createElement('div', 'lobby-players')
  private readonly playerCount = createElement('strong', 'lobby-count', '0/0')
  private readonly chatMessages = createElement('div', 'chat-messages')
  private readonly mode = createElement('strong', '', 'Classic Rivals')

  constructor(onInvite: () => void, onStart: () => void, onLeave: () => void) {
    const lobbyGrid = createElement('div', 'lobby-grid')
    const left = createElement('section', 'lobby-column')
    const right = createElement('section', 'lobby-column')

    const heading = createElement('div', 'lobby-heading')
    heading.append(createElement('span', '', 'Players'), this.playerCount)
    left.append(heading, this.players)

    const mapPreview = createElement('div', 'map-preview')
    mapPreview.innerHTML = `
      <span class="map-token"></span>
      <span class="map-token"></span>
      <span class="map-token"></span>
      <span class="map-token"></span>
    `

    const meta = createElement('div', 'lobby-meta')
    meta.append(createElement('span', '', 'Game Mode'), this.mode)

    this.chatMessages.setAttribute('aria-live', 'polite')
    const chat = createElement('div', 'chat-window')
    chat.append(createElement('strong', '', 'Guild Chat'), this.chatMessages)

    const actions = createElement('div', 'panel-actions')
    const invite = createButton('Invite', 'rpg-button rpg-button-orange')
    const start = createButton('Start Game', 'rpg-button rpg-button-green')
    const leave = createButton('Leave Lobby', 'rpg-button rpg-button-muted')
    invite.addEventListener('click', onInvite)
    start.addEventListener('click', onStart)
    leave.addEventListener('click', onLeave)
    actions.append(invite, start, leave)

    right.append(mapPreview, meta, chat, actions)
    lobbyGrid.append(left, right)
    this.element.append(lobbyGrid)
  }

  updatePlayers(players: LobbyPlayer[], maxPlayers = 4): void {
    this.players.replaceChildren()
    this.playerCount.textContent = `${players.length}/${maxPlayers}`

    players.forEach((player) => {
      const card = createElement('article', `lobby-player ${player.ready ? 'ready' : ''}`)
      card.innerHTML = `
        <div class="lobby-avatar">${escapeHtml(player.avatar)}</div>
        <div>
          <strong>${escapeHtml(player.name)}</strong>
          <span>${player.ready ? 'Ready' : 'Choosing gear'}</span>
        </div>
      `
      if (player.host) card.append(createElement('em', 'host-badge', 'Host'))
      this.players.append(card)
    })
  }

  setMode(mode: string): void {
    this.mode.textContent = mode
  }

  addChatMessage(message: ChatMessage): void {
    const row = createElement('p', `chat-message ${message.tone === 'system' ? 'system' : ''}`)
    row.innerHTML = `<strong>${escapeHtml(message.player)}</strong><span>${escapeHtml(message.message)}</span>`
    this.chatMessages.append(row)
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight
  }
}
