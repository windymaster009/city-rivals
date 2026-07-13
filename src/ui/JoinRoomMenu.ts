import { createButton, createElement, escapeHtml, field, input, panelShell } from './dom'
import type { RoomInfo } from './types'

export class JoinRoomMenu {
  readonly element = panelShell('Join Room', 'join-panel')
  private readonly list = createElement('div', 'room-list')
  private readonly search = input('searchRoom', 'search', 'Search room')
  private rooms: RoomInfo[] = []

  constructor(onJoin: (roomId: string) => void, onRefresh: () => void, onBack: () => void) {
    const toolbar = createElement('div', 'room-toolbar')
    const refresh = createButton('Refresh', 'rpg-button rpg-button-small rpg-button-green')
    const back = createButton('Back', 'rpg-button rpg-button-small rpg-button-muted')

    refresh.addEventListener('click', onRefresh)
    back.addEventListener('click', onBack)
    this.search.addEventListener('input', () => this.render(onJoin))
    toolbar.append(field('Search Room', this.search), refresh, back)

    this.list.setAttribute('tabindex', '0')
    this.element.append(toolbar, this.list)
  }

  updateRooms(rooms: RoomInfo[], onJoin: (roomId: string) => void): void {
    this.rooms = rooms
    this.render(onJoin)
  }

  private render(onJoin: (roomId: string) => void): void {
    const query = this.search.value.toLowerCase().trim()
    const filtered = this.rooms.filter((room) => room.name.toLowerCase().includes(query))
    this.list.replaceChildren()

    if (filtered.length === 0) {
      this.list.append(createElement('div', 'empty-state', 'No rooms match that search.'))
      return
    }

    filtered.forEach((room) => {
      const card = createElement('article', 'room-card')
      const join = createButton('Join', 'rpg-button rpg-button-small rpg-button-green')
      join.disabled = room.status === 'Full' || room.status === 'In Match'
      join.addEventListener('click', () => onJoin(room.id))
      card.innerHTML = `
        <div>
          <strong>${escapeHtml(room.name)}</strong>
          <span>${escapeHtml(room.mode)}</span>
        </div>
        <dl>
          <div><dt>Players</dt><dd>${room.players}/${room.maxPlayers}</dd></div>
          <div><dt>Ping</dt><dd>${room.ping} ms</dd></div>
          <div><dt>Status</dt><dd>${escapeHtml(room.status)}</dd></div>
        </dl>
      `
      card.append(join)
      this.list.append(card)
    })
  }
}
