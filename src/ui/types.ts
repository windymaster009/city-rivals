export type MenuView =
  | 'main'
  | 'create-room'
  | 'join-room'
  | 'lobby'
  | 'settings'
  | 'profile'
  | 'leaderboard'
  | 'credits'
  | 'pause'

export interface RoomInfo {
  id: string
  name: string
  players: number
  maxPlayers: number
  ping: number
  status: 'Open' | 'In Match' | 'Private' | 'Full'
  mode: string
}

export interface LobbyPlayer {
  id: string
  name: string
  avatar: string
  ready: boolean
  host?: boolean
}

export interface ChatMessage {
  player: string
  message: string
  tone?: 'system' | 'player'
}

export interface NotificationOptions {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'danger' | 'achievement'
  duration?: number
}

export interface RoomSettings {
  roomName: string
  maxPlayers: number
  gameMode: string
  isPrivate: boolean
  password: string
}

export interface GameUiEvents {
  playOnline: void
  createRoom: RoomSettings
  joinRoom: string
  refreshRooms: void
  invite: void
  startGame: void
  leaveLobby: void
  resume: void
  leaveMatch: void
  quit: void
  logout: void
}

export type GameUiEventName = keyof GameUiEvents
export type GameUiHandler<T extends GameUiEventName> = (payload: GameUiEvents[T]) => void
