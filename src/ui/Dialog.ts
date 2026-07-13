import { createButton, createElement } from './dom'

export class Dialog {
  readonly element = createElement('div', 'dialog-backdrop hidden')
  private readonly title = createElement('h2')
  private readonly body = createElement('p')

  constructor(root: HTMLElement) {
    const dialog = createElement('section', 'dialog-card stone-frame paper-sheet')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    const close = createButton('Close', 'rpg-button rpg-button-green')
    close.addEventListener('click', () => this.hide())
    dialog.append(this.title, this.body, close)
    this.element.append(dialog)
    root.append(this.element)
  }

  show(title: string, body: string): void {
    this.title.textContent = title
    this.body.textContent = body
    this.element.classList.remove('hidden')
  }

  hide(): void {
    this.element.classList.add('hidden')
  }
}
