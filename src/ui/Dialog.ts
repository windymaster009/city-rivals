import { createButton, createElement } from './dom'

export class Dialog {
  readonly element = createElement('div', 'dialog-backdrop hidden')
  private readonly title = createElement('h2')
  private readonly body = createElement('p')
  private readonly actions = createElement('div', 'dialog-actions')

  constructor(root: HTMLElement) {
    const dialog = createElement('section', 'dialog-card stone-frame paper-sheet')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.append(this.title, this.body, this.actions)
    this.element.append(dialog)
    root.append(this.element)
  }

  show(title: string, body: string): void {
    this.title.textContent = title
    this.body.textContent = body
    const close = createButton('Close', 'rpg-button rpg-button-green')
    close.addEventListener('click', () => this.hide())
    this.actions.replaceChildren(close)
    this.element.classList.remove('hidden')
    close.focus()
  }

  choose<T extends string>(
    title: string,
    body: string,
    choices: ReadonlyArray<{ value: T; label: string; className: string }>,
  ): Promise<T> {
    this.title.textContent = title
    this.body.textContent = body

    return new Promise((resolve) => {
      const buttons = choices.map((choice) => {
        const button = createButton(choice.label, `rpg-button ${choice.className}`)
        button.addEventListener('click', () => {
          this.hide()
          resolve(choice.value)
        }, { once: true })
        return button
      })

      this.actions.replaceChildren(...buttons)
      this.element.classList.remove('hidden')
      buttons[0]?.focus()
    })
  }

  hide(): void {
    this.element.classList.add('hidden')
  }
}
