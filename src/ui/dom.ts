export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text !== undefined) element.textContent = text
  return element
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function createButton(label: string, className = 'rpg-button', type: 'button' | 'submit' = 'button'): HTMLButtonElement {
  const button = createElement('button', className, label)
  button.type = type
  return button
}

export function createIconButton(label: string, icon: string, className = 'rpg-icon-button'): HTMLButtonElement {
  const button = createButton('', className)
  button.setAttribute('aria-label', label)
  button.title = label
  button.innerHTML = `<span aria-hidden="true">${icon}</span>`
  return button
}

export function panelShell(title: string, className = ''): HTMLElement {
  const panel = createElement('section', `rpg-panel stone-frame paper-sheet ${className}`.trim())
  panel.setAttribute('aria-label', title)

  const cap = createElement('div', 'stone-cap', title)
  panel.append(cap)
  return panel
}

export function field(labelText: string, control: HTMLInputElement | HTMLSelectElement): HTMLLabelElement {
  const label = createElement('label', 'rpg-field')
  const span = createElement('span', '', labelText)
  label.append(span, control)
  return label
}

export function input(name: string, type = 'text', placeholder = ''): HTMLInputElement {
  const element = createElement('input')
  element.name = name
  element.type = type
  element.placeholder = placeholder
  return element
}

export function select(name: string, values: string[]): HTMLSelectElement {
  const element = createElement('select')
  element.name = name
  values.forEach((value) => {
    const option = createElement('option')
    option.value = value
    option.textContent = value
    element.append(option)
  })
  return element
}
