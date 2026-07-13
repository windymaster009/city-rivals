import type { GameUiEventName, GameUiEvents, GameUiHandler } from './types'

export class UiEventBus {
  private listeners = new Map<GameUiEventName, Set<(payload: unknown) => void>>()

  on<T extends GameUiEventName>(eventName: T, handler: GameUiHandler<T>): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>()
    listeners.add(handler as (payload: unknown) => void)
    this.listeners.set(eventName, listeners)
    return () => listeners.delete(handler as (payload: unknown) => void)
  }

  emit<T extends GameUiEventName>(eventName: T, payload: GameUiEvents[T]): void {
    this.listeners.get(eventName)?.forEach((handler) => handler(payload))
  }
}
