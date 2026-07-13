import '../../styles/tile-result-popup.css'
import { createButton, createElement, escapeHtml } from './dom'
import type { NotificationOptions } from './types'

export class NotificationCenter {
  readonly element = createElement('div', 'toast-region')
  private loadingOverlay = createElement('div', 'loading-overlay hidden')
  private readonly root: HTMLElement
  private activeTilePopup?: HTMLElement
  private activeTileKeyHandler?: (event: KeyboardEvent) => void

  constructor(root: HTMLElement) {
    this.root = root
    this.element.setAttribute('aria-live', 'polite')
    this.loadingOverlay.setAttribute('role', 'status')
    this.loadingOverlay.innerHTML = `
      <div class="loading-rune" aria-hidden="true"></div>
      <strong>Opening the gates...</strong>
      <span>Please wait</span>
    `
    this.root.append(this.element, this.loadingOverlay)
  }

  show(options: NotificationOptions): void {
    if (options.title.startsWith('Tile ')) {
      this.showTileResult(options)
      return
    }

    const toast = createElement('article', `toast toast-${options.type ?? 'info'}`)
    toast.innerHTML = `
      <div class="toast-sigil" aria-hidden="true"></div>
      <div>
        <strong>${escapeHtml(options.title)}</strong>
        <p>${escapeHtml(options.message)}</p>
      </div>
    `
    const close = createButton('x', 'toast-close')
    close.setAttribute('aria-label', 'Dismiss notification')
    close.addEventListener('click', () => this.dismiss(toast))
    toast.append(close)
    this.element.append(toast)

    window.setTimeout(() => toast.classList.add('shown'), 20)
    window.setTimeout(() => this.dismiss(toast), options.duration ?? 4200)
  }

  achievement(title: string, message: string): void {
    this.show({ title, message, type: 'achievement', duration: 5600 })
  }

  showConnectionLost(): void {
    this.show({ title: 'Connection Lost', message: 'Trying to find the game server again.', type: 'danger', duration: 8000 })
  }

  showReconnect(): void {
    this.show({ title: 'Reconnected', message: 'Your party link is alive again.', type: 'success' })
  }

  showLoading(message = 'Loading'): void {
    const label = this.loadingOverlay.querySelector('strong')
    if (label) label.textContent = message
    this.loadingOverlay.classList.remove('hidden')
  }

  hideLoading(): void {
    this.loadingOverlay.classList.add('hidden')
  }

  private showTileResult(options: NotificationOptions): void {
    this.closeActiveTilePopup(true)

    const tone = options.type ?? 'info'
    const iconByTone: Record<string, string> = {
      success: '🎁',
      warning: '⚠️',
      danger: '💔',
      info: '📍',
      achievement: '🏆',
    }

    const backdrop = createElement('div', 'tile-result-backdrop')
    const card = createElement('section', `tile-result-card tile-result-${tone}`)
    card.setAttribute('role', 'dialog')
    card.setAttribute('aria-modal', 'true')
    card.setAttribute('aria-labelledby', 'tile-result-title')
    card.setAttribute('aria-describedby', 'tile-result-message')

    const icon = createElement('div', 'tile-result-icon', iconByTone[tone] ?? '📍')
    icon.setAttribute('aria-hidden', 'true')

    const kicker = createElement('span', 'tile-result-kicker', 'Landing Result')
    const title = createElement('h2', '', options.title)
    title.id = 'tile-result-title'

    const message = createElement('p', 'tile-result-message', options.message)
    message.id = 'tile-result-message'

    const statusNote = createElement(
      'p',
      'tile-result-status-note',
      'Hearts, money, and private inventory have been updated in the HUD.',
    )

    const continueButton = createButton('Continue', 'tile-result-continue')
    continueButton.addEventListener('click', () => this.closeActiveTilePopup())

    card.append(icon, kicker, title, message, statusNote, continueButton)
    backdrop.append(card)

    // The fantasy menu is hidden during a match. Mount the landing popup on its
    // parent game root so it remains visible above the board and gameplay HUD.
    const gameplayHost = this.root.parentElement ?? this.root
    gameplayHost.append(backdrop)
    this.activeTilePopup = backdrop

    this.activeTileKeyHandler = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') {
        event.preventDefault()
        this.closeActiveTilePopup()
      }
    }
    window.addEventListener('keydown', this.activeTileKeyHandler)

    window.requestAnimationFrame(() => {
      backdrop.classList.add('shown')
      continueButton.focus()
    })
  }

  private closeActiveTilePopup(removeImmediately = false): void {
    if (this.activeTileKeyHandler) {
      window.removeEventListener('keydown', this.activeTileKeyHandler)
      this.activeTileKeyHandler = undefined
    }

    const popup = this.activeTilePopup
    if (!popup) return

    this.activeTilePopup = undefined

    if (removeImmediately) {
      popup.remove()
      return
    }

    popup.classList.remove('shown')
    window.setTimeout(() => popup.remove(), 220)
  }

  private dismiss(toast: HTMLElement): void {
    toast.classList.remove('shown')
    window.setTimeout(() => toast.remove(), 220)
  }
}
