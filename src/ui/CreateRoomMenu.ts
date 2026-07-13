import { createButton, createElement, field, input, panelShell, select } from './dom'
import type { RoomSettings } from './types'

export class CreateRoomMenu {
  readonly element = panelShell('Create Room', 'form-panel')
  private readonly form = createElement('form', 'rpg-form')

  constructor(onCreate: (settings: RoomSettings) => void, onBack: () => void) {
    const roomName = input('roomName', 'text', 'Moonlit Market')
    roomName.required = true
    roomName.maxLength = 28

    const maxPlayers = input('maxPlayers', 'number')
    maxPlayers.min = '2'
    maxPlayers.max = '8'
    maxPlayers.value = '4'

    const gameMode = select('gameMode', ['Classic Rivals', 'Treasure Rush', 'Guild Duel', 'Survival Run'])

    const privateToggle = input('private', 'checkbox')
    const password = input('password', 'password', 'Optional password')
    password.disabled = true

    privateToggle.addEventListener('change', () => {
      password.disabled = !privateToggle.checked
      if (!privateToggle.checked) password.value = ''
    })

    const checkboxLabel = createElement('label', 'rpg-checkbox')
    checkboxLabel.append(privateToggle, createElement('span', '', 'Private Room'))

    const actions = createElement('div', 'panel-actions')
    const back = createButton('Back', 'rpg-button rpg-button-muted')
    const create = createButton('Create', 'rpg-button rpg-button-green', 'submit')
    back.addEventListener('click', onBack)
    actions.append(back, create)

    this.form.append(
      field('Room Name', roomName),
      field('Maximum Players', maxPlayers),
      field('Game Mode', gameMode),
      checkboxLabel,
      field('Password', password),
      actions,
    )

    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      onCreate({
        roomName: roomName.value.trim(),
        maxPlayers: Number(maxPlayers.value),
        gameMode: gameMode.value,
        isPrivate: privateToggle.checked,
        password: password.value,
      })
    })

    this.element.append(this.form)
  }
}
