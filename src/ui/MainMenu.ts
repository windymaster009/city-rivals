import { createButton, createElement, panelShell } from './dom'
import type { MenuView } from './types'

type Navigate = (view: MenuView) => void
type Emit = (name: 'playOnline' | 'quit') => void

export class MainMenu {
  readonly element = panelShell('Menu', 'main-menu-panel')
  private readonly ping = createElement('strong', 'ping-value', '-- ms')

  constructor(navigate: Navigate, emit: Emit) {
    const logo = createElement('div', 'game-logo')
    logo.innerHTML = `
      <span class="logo-crown" aria-hidden="true"></span>
      <strong>City Rivals</strong>
      <small>Guilds of the Old Quarter</small>
    `

    const actions = createElement('div', 'main-menu-actions')
    const playOnline = createButton('Play Online', 'rpg-button rpg-button-green')
    playOnline.addEventListener('click', () => emit('playOnline'))

    const createRoom = createButton('Create Room', 'rpg-button rpg-button-orange')
    createRoom.addEventListener('click', () => navigate('create-room'))

    const joinRoom = createButton('Join Room', 'rpg-button rpg-button-cyan')
    joinRoom.addEventListener('click', () => navigate('join-room'))

    const settings = createButton('Settings')
    settings.addEventListener('click', () => navigate('settings'))

    const profile = createButton('Profile')
    profile.addEventListener('click', () => navigate('profile'))

    const leaderboard = createButton('Leaderboard')
    leaderboard.addEventListener('click', () => navigate('leaderboard'))

    const credits = createButton('Credits')
    credits.addEventListener('click', () => navigate('credits'))

    const quit = createButton('Quit', 'rpg-button rpg-button-muted')
    quit.addEventListener('click', () => emit('quit'))

    actions.append(playOnline, createRoom, joinRoom, settings, profile, leaderboard, credits, quit)
    this.element.append(logo, actions)
  }

  statusBar(version: string): HTMLElement {
    const status = createElement('div', 'menu-status')
    const versionLabel = createElement('span', 'version-label', `v${version}`)
    const pingLabel = createElement('span', 'ping-label')
    pingLabel.append('Ping ', this.ping)
    status.append(versionLabel, pingLabel)
    return status
  }

  updatePing(value: number): void {
    this.ping.textContent = `${Math.round(value)} ms`
    this.ping.classList.toggle('ping-warn', value > 140)
  }
}
