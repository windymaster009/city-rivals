import { CreateRoomMenu } from './CreateRoomMenu'
import { Dialog } from './Dialog'
import { createButton, createElement } from './dom'
import { UiEventBus } from './events'
import { InventoryMenu } from './InventoryMenu'
import { JoinRoomMenu } from './JoinRoomMenu'
import { LobbyMenu } from './LobbyMenu'
import { MainMenu } from './MainMenu'
import { NotificationCenter } from './Notification'
import { PauseMenu } from './PauseMenu'
import { SettingsMenu } from './SettingsMenu'
import type {
  ChatMessage,
  GameUiEventName,
  GameUiEvents,
  GameUiHandler,
  LobbyPlayer,
  MenuView,
  NotificationOptions,
  RoomInfo,
  RoomSettings,
} from './types'

const DEMO_ROOMS: RoomInfo[] = [
  { id: 'market-01', name: 'Moonlit Market', players: 2, maxPlayers: 4, ping: 38, status: 'Open', mode: 'Classic Rivals' },
  { id: 'keep-02', name: 'Old Keep Skirmish', players: 4, maxPlayers: 4, ping: 72, status: 'Full', mode: 'Guild Duel' },
  { id: 'forest-03', name: 'Mossgate Run', players: 1, maxPlayers: 6, ping: 55, status: 'Private', mode: 'Survival Run' },
  { id: 'dock-04', name: 'Lantern Docks', players: 3, maxPlayers: 5, ping: 112, status: 'Open', mode: 'Treasure Rush' },
]

const DEMO_PLAYERS: LobbyPlayer[] = [
  { id: 'p1', name: 'Windy', avatar: 'W', ready: true, host: true },
  { id: 'p2', name: 'Rival', avatar: 'R', ready: false },
  { id: 'p3', name: 'Sage', avatar: 'S', ready: true },
]

export class GameUI {
  readonly root = createElement('div', 'fantasy-ui')
  private readonly bus = new UiEventBus()
  private readonly views = new Map<MenuView, HTMLElement>()
  private readonly mainMenu: MainMenu
  private readonly joinRoomMenu: JoinRoomMenu
  private readonly lobbyMenu: LobbyMenu
  private readonly notifications: NotificationCenter
  private readonly dialog: Dialog
  private readonly mount: HTMLElement
  private activeView: MenuView = 'main'

  constructor(mount: HTMLElement, version = '0.1.0') {
    this.mount = mount
    this.root.setAttribute('data-active-view', this.activeView)
    this.root.innerHTML = `
      <div class="fantasy-sky" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    `

    const topRight = createElement('div', 'player-corner')
    topRight.innerHTML = `
      <button class="avatar-button" type="button" aria-label="Open profile">WK</button>
      <span>Guest Knight</span>
    `
    topRight.querySelector('button')?.addEventListener('click', () => this.showView('profile'))

    const emit = <T extends GameUiEventName>(eventName: T, payload: GameUiEvents[T]) => this.bus.emit(eventName, payload)
    this.mainMenu = new MainMenu((view) => this.showView(view), (name) => emit(name, undefined))
    const createRoom = new CreateRoomMenu((settings) => this.handleCreateRoom(settings), () => this.showView('main'))
    this.joinRoomMenu = new JoinRoomMenu((roomId) => this.handleJoinRoom(roomId), () => emit('refreshRooms', undefined), () => this.showView('main'))
    this.lobbyMenu = new LobbyMenu(
      () => emit('invite', undefined),
      () => emit('startGame', undefined),
      () => {
        emit('leaveLobby', undefined)
        this.showView('main')
      },
    )
    const settingsMenu = new SettingsMenu(() => this.showView('main'), () => emit('logout', undefined))
    const pauseMenu = new PauseMenu(
      () => emit('resume', undefined),
      () => this.showView('settings'),
      () => emit('leaveMatch', undefined),
      () => emit('quit', undefined),
    )
    const inventoryMenu = new InventoryMenu()

    this.registerView('main', this.mainMenu.element)
    this.registerView('create-room', createRoom.element)
    this.registerView('join-room', this.joinRoomMenu.element)
    this.registerView('lobby', this.lobbyMenu.element)
    this.registerView('settings', settingsMenu.element)
    this.registerView('pause', pauseMenu.element)
    this.registerView('profile', this.placeholderPanel('Profile', 'Guest Knight', 'Avatar, cosmetics, guild banner, and account stats live here.'))
    this.registerView('leaderboard', this.placeholderPanel('Leaderboard', 'Top Guilds', 'Seasonal rankings will be fed by the multiplayer service.'))
    this.registerView('credits', this.placeholderPanel('Credits', 'Made for City Rivals', 'A compact fantasy UI shell for the multiplayer prototype.'))

    const menuStage = createElement('main', 'menu-stage')
    this.views.forEach((view) => menuStage.append(view))
    this.root.append(topRight, menuStage, this.mainMenu.statusBar(version), inventoryMenu.element)
    this.mount.append(this.root)

    this.notifications = new NotificationCenter(this.root)
    this.dialog = new Dialog(this.mount)
    this.joinRoomMenu.updateRooms(DEMO_ROOMS, (roomId) => this.handleJoinRoom(roomId))
    this.lobbyMenu.updatePlayers(DEMO_PLAYERS, 4)
    this.lobbyMenu.addChatMessage({ player: 'System', message: 'Welcome to the lobby.', tone: 'system' })
    this.showView('main')
  }

  on<T extends GameUiEventName>(eventName: T, handler: GameUiHandler<T>): () => void {
    return this.bus.on(eventName, handler)
  }

  showMainMenu(): void {
    this.root.classList.remove('hidden')
    this.showView('main')
  }

  hideMainMenu(): void {
    this.root.classList.add('hidden')
  }

  showLobby(): void {
    this.root.classList.remove('hidden')
    this.showView('lobby')
  }

  hideLobby(): void {
    if (this.activeView === 'lobby') this.showView('main')
  }

  updatePlayers(players: LobbyPlayer[], maxPlayers = 4): void {
    this.lobbyMenu.updatePlayers(players, maxPlayers)
  }

  updateRooms(rooms: RoomInfo[]): void {
    this.joinRoomMenu.updateRooms(rooms, (roomId) => this.handleJoinRoom(roomId))
  }

  updatePing(ping: number): void {
    this.mainMenu.updatePing(ping)
  }

  showReconnect(): void {
    this.notifications.showReconnect()
  }

  showConnectionLost(): void {
    this.notifications.showConnectionLost()
  }

  showLoading(message?: string): void {
    this.notifications.showLoading(message)
  }

  hideLoading(): void {
    this.notifications.hideLoading()
  }

  showNotification(options: NotificationOptions): void {
    this.notifications.show(options)
  }

  showAchievement(title: string, message: string): void {
    this.notifications.achievement(title, message)
  }

  showChatMessage(message: ChatMessage): void {
    this.lobbyMenu.addChatMessage(message)
  }

  showDialog(title: string, body: string): void {
    this.dialog.show(title, body)
  }

  choose<T extends string>(
    title: string,
    body: string,
    choices: ReadonlyArray<{ value: T; label: string; className: string }>,
  ): Promise<T> {
    return this.dialog.choose(title, body, choices)
  }

  private registerView(name: MenuView, element: HTMLElement): void {
    element.classList.add('menu-view')
    element.dataset.view = name
    this.views.set(name, element)
  }

  private showView(name: MenuView): void {
    this.activeView = name
    this.root.dataset.activeView = name
    this.views.forEach((view, key) => {
      view.classList.toggle('active', key === name)
      view.setAttribute('aria-hidden', String(key !== name))
    })
  }

  private handleCreateRoom(settings: RoomSettings): void {
    this.bus.emit('createRoom', settings)
    this.lobbyMenu.setMode(settings.gameMode)
    this.updatePlayers([DEMO_PLAYERS[0]], settings.maxPlayers)
    this.showLobby()
    this.showNotification({ title: 'Room Created', message: `${settings.roomName} is ready.`, type: 'success' })
  }

  private handleJoinRoom(roomId: string): void {
    this.bus.emit('joinRoom', roomId)
    const room = DEMO_ROOMS.find((candidate) => candidate.id === roomId)
    if (room) this.lobbyMenu.setMode(room.mode)
    this.showLobby()
  }

  private placeholderPanel(title: string, heading: string, body: string): HTMLElement {
    const panel = createElement('section', 'rpg-panel stone-frame paper-sheet placeholder-panel')
    const back = createButton('Back', 'rpg-button rpg-button-muted')
    back.addEventListener('click', () => this.showView('main'))
    panel.append(createElement('div', 'stone-cap', title), createElement('h2', '', heading), createElement('p', '', body), back)
    return panel
  }
}

export function createGameUI(mount: HTMLElement, version?: string): GameUI {
  return new GameUI(mount, version)
}
