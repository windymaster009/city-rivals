import { createButton, createElement, escapeHtml } from './dom'
import type { NotificationOptions } from './types'

export class NotificationCenter {
  readonly element = createElement('div', 'toast-region')
  private loadingOverlay = createElement('div', 'loading-overlay hidden')
  private readonly root: HTMLElement

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

  private dismiss(toast: HTMLElement): void {
    toast.classList.remove('shown')
    window.setTimeout(() => toast.remove(), 220)
  }
}
