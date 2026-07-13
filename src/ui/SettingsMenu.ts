import { createButton, createElement, field, input, panelShell, select } from './dom'

type TabName = 'Graphics' | 'Audio' | 'Controls' | 'Gameplay' | 'Language' | 'Account'

export class SettingsMenu {
  readonly element = panelShell('Settings', 'settings-panel')
  private readonly content = createElement('div', 'settings-content')
  private readonly tabs = createElement('div', 'settings-tabs')
  private activeTab: TabName = 'Graphics'

  constructor(onBack: () => void, onLogout: () => void) {
    const tabNames: TabName[] = ['Graphics', 'Audio', 'Controls', 'Gameplay', 'Language', 'Account']
    tabNames.forEach((tab) => {
      const button = createButton(tab, 'tab-button')
      button.addEventListener('click', () => {
        this.activeTab = tab
        this.render(onLogout)
      })
      this.tabs.append(button)
    })

    const back = createButton('Back', 'rpg-button rpg-button-muted settings-back')
    back.addEventListener('click', onBack)
    this.element.append(this.tabs, this.content, back)
    this.render(onLogout)
  }

  private render(onLogout: () => void): void {
    Array.from(this.tabs.children).forEach((child) => {
      child.classList.toggle('active', child.textContent === this.activeTab)
    })
    this.content.replaceChildren()

    if (this.activeTab === 'Graphics') {
      this.content.append(
        this.toggle('Fullscreen', true),
        field('Resolution', select('resolution', ['1920 x 1080', '2560 x 1440', '3840 x 2160'])),
        this.toggle('VSync', true),
        field('FPS Limit', select('fps', ['60', '120', '144', 'Unlimited'])),
        field('Shadow Quality', select('shadows', ['Low', 'Medium', 'High', 'Epic'])),
        field('Texture Quality', select('textures', ['Medium', 'High', 'Ultra'])),
      )
    }

    if (this.activeTab === 'Audio') {
      this.content.append(
        field('Master', this.range('master', 85)),
        field('Music', this.range('music', 68)),
        field('Effects', this.range('effects', 78)),
        field('Voice Chat', this.range('voice', 60)),
      )
    }

    if (this.activeTab === 'Controls') {
      this.content.append(
        field('Mouse Sensitivity', this.range('mouse', 42)),
        this.toggle('Invert Mouse', false),
        field('Key Bindings', select('keybinds', ['Default', 'Left Handed', 'Custom'])),
      )
    }

    if (this.activeTab === 'Gameplay') {
      this.content.append(
        this.toggle('Crosshair', true),
        field('Camera Distance', this.range('camera', 54)),
      )
    }

    if (this.activeTab === 'Language') {
      this.content.append(field('Language', select('language', ['English', 'Khmer', 'French', 'Japanese', 'Spanish'])))
    }

    if (this.activeTab === 'Account') {
      const logout = createButton('Logout', 'rpg-button rpg-button-orange')
      logout.addEventListener('click', onLogout)
      this.content.append(createElement('p', 'settings-note', 'Signed in as Guest Knight'), logout)
    }
  }

  private toggle(labelText: string, checked: boolean): HTMLLabelElement {
    const control = input(labelText.toLowerCase().replaceAll(' ', '-'), 'checkbox')
    control.checked = checked
    const label = createElement('label', 'rpg-switch')
    label.append(createElement('span', '', labelText), control, createElement('i'))
    return label
  }

  private range(name: string, value: number): HTMLInputElement {
    const control = input(name, 'range')
    control.min = '0'
    control.max = '100'
    control.value = String(value)
    return control
  }
}
