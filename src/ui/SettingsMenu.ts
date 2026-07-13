import { soundManager } from '../audio/SoundManager'
import {
  displayKeyCode,
  gameSettings,
  languageCode,
  type FpsLimitOption,
  type GameLanguage,
  type KeyBindingPreset,
  type ResolutionOption,
  type ShadowQualityOption,
  type TextureQualityOption,
} from '../settings/GameSettings'
import { createButton, createElement, field, input, panelShell, select } from './dom'

type TabName = 'Graphics' | 'Audio' | 'Controls' | 'Gameplay' | 'Language' | 'Account'

type CopyKey =
  | 'title'
  | 'graphics'
  | 'audio'
  | 'controls'
  | 'gameplay'
  | 'language'
  | 'account'
  | 'fullscreen'
  | 'resolution'
  | 'vsync'
  | 'fpsLimit'
  | 'shadowQuality'
  | 'textureQuality'
  | 'masterVolume'
  | 'effectsVolume'
  | 'muteAll'
  | 'testSound'
  | 'soundSaved'
  | 'mouseSensitivity'
  | 'invertMouse'
  | 'keyBindings'
  | 'rollDiceKey'
  | 'cameraKey'
  | 'newMatchKey'
  | 'pressKey'
  | 'showCrosshair'
  | 'cameraDistance'
  | 'resetCamera'
  | 'languageLabel'
  | 'accountStatus'
  | 'logout'
  | 'resetAll'
  | 'savedNote'
  | 'back'

const COPY: Readonly<Record<GameLanguage, Readonly<Record<CopyKey, string>>>> = {
  English: {
    title: 'Settings', graphics: 'Graphics', audio: 'Audio', controls: 'Controls', gameplay: 'Gameplay',
    language: 'Language', account: 'Account', fullscreen: 'Fullscreen', resolution: 'Render Resolution',
    vsync: 'Smooth Frame Pacing', fpsLimit: 'FPS Limit', shadowQuality: 'Shadow Quality',
    textureQuality: 'Texture Quality', masterVolume: 'Master Volume', effectsVolume: 'Effects Volume',
    muteAll: 'Mute All Sound', testSound: 'Play Test Sound', soundSaved: 'Sound settings are saved automatically.',
    mouseSensitivity: 'Mouse Sensitivity', invertMouse: 'Invert Mouse', keyBindings: 'Key Bindings',
    rollDiceKey: 'Roll Dice Key', cameraKey: 'Camera View Key', newMatchKey: 'New Match Key',
    pressKey: 'Press a key…', showCrosshair: 'Show Crosshair', cameraDistance: 'Camera Distance',
    resetCamera: 'Reset Board Camera', languageLabel: 'Language', accountStatus: 'Signed in as Guest Knight',
    logout: 'Logout', resetAll: 'Reset All Settings', savedNote: 'Changes are saved automatically in this browser.',
    back: 'Back',
  },
  Khmer: {
    title: 'ការកំណត់', graphics: 'ក្រាហ្វិក', audio: 'សំឡេង', controls: 'ការបញ្ជា', gameplay: 'ការលេង',
    language: 'ភាសា', account: 'គណនី', fullscreen: 'ពេញអេក្រង់', resolution: 'គុណភាពបង្ហាញ',
    vsync: 'ចលនារលូន', fpsLimit: 'កម្រិត FPS', shadowQuality: 'គុណភាពស្រមោល',
    textureQuality: 'គុណភាពរូបភាព', masterVolume: 'សំឡេងសរុប', effectsVolume: 'សំឡេងបែបផែន',
    muteAll: 'បិទសំឡេងទាំងអស់', testSound: 'សាកល្បងសំឡេង', soundSaved: 'ការកំណត់សំឡេងត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។',
    mouseSensitivity: 'ល្បឿន Mouse', invertMouse: 'បញ្ច្រាស Mouse', keyBindings: 'គ្រាប់ចុចបញ្ជា',
    rollDiceKey: 'គ្រាប់ចុចបោះគ្រាប់ឡុកឡាក់', cameraKey: 'គ្រាប់ចុចកាមេរ៉ា', newMatchKey: 'គ្រាប់ចុចប្រកួតថ្មី',
    pressKey: 'ចុចគ្រាប់ចុច…', showCrosshair: 'បង្ហាញសញ្ញាកណ្ដាល', cameraDistance: 'ចម្ងាយកាមេរ៉ា',
    resetCamera: 'កំណត់កាមេរ៉ាឡើងវិញ', languageLabel: 'ភាសា', accountStatus: 'ចូលជា Guest Knight',
    logout: 'ចាកចេញ', resetAll: 'កំណត់ទាំងអស់ឡើងវិញ', savedNote: 'ការផ្លាស់ប្តូរត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។',
    back: 'ត្រឡប់ក្រោយ',
  },
  French: {
    title: 'Paramètres', graphics: 'Graphismes', audio: 'Audio', controls: 'Commandes', gameplay: 'Jeu',
    language: 'Langue', account: 'Compte', fullscreen: 'Plein écran', resolution: 'Résolution de rendu',
    vsync: 'Fluidité des images', fpsLimit: 'Limite FPS', shadowQuality: 'Qualité des ombres',
    textureQuality: 'Qualité des textures', masterVolume: 'Volume principal', effectsVolume: 'Effets sonores',
    muteAll: 'Couper tous les sons', testSound: 'Tester le son', soundSaved: 'Les réglages audio sont enregistrés automatiquement.',
    mouseSensitivity: 'Sensibilité de la souris', invertMouse: 'Inverser la souris', keyBindings: 'Touches',
    rollDiceKey: 'Touche lancer les dés', cameraKey: 'Touche caméra', newMatchKey: 'Touche nouvelle partie',
    pressKey: 'Appuyez sur une touche…', showCrosshair: 'Afficher le viseur', cameraDistance: 'Distance caméra',
    resetCamera: 'Réinitialiser la caméra', languageLabel: 'Langue', accountStatus: 'Connecté comme Guest Knight',
    logout: 'Déconnexion', resetAll: 'Réinitialiser les paramètres', savedNote: 'Les modifications sont enregistrées automatiquement.',
    back: 'Retour',
  },
  Japanese: {
    title: '設定', graphics: 'グラフィック', audio: 'オーディオ', controls: '操作', gameplay: 'ゲーム',
    language: '言語', account: 'アカウント', fullscreen: 'フルスクリーン', resolution: '描画解像度',
    vsync: '滑らかなフレーム', fpsLimit: 'FPS上限', shadowQuality: '影の品質',
    textureQuality: 'テクスチャ品質', masterVolume: 'マスター音量', effectsVolume: '効果音',
    muteAll: 'すべてミュート', testSound: 'サウンドテスト', soundSaved: 'サウンド設定は自動保存されます。',
    mouseSensitivity: 'マウス感度', invertMouse: 'マウス反転', keyBindings: 'キー設定',
    rollDiceKey: 'ダイスキー', cameraKey: 'カメラキー', newMatchKey: '新規試合キー',
    pressKey: 'キーを押してください…', showCrosshair: 'クロスヘア表示', cameraDistance: 'カメラ距離',
    resetCamera: 'カメラをリセット', languageLabel: '言語', accountStatus: 'Guest Knightとしてログイン中',
    logout: 'ログアウト', resetAll: '設定をリセット', savedNote: '変更は自動的に保存されます。',
    back: '戻る',
  },
  Spanish: {
    title: 'Ajustes', graphics: 'Gráficos', audio: 'Audio', controls: 'Controles', gameplay: 'Juego',
    language: 'Idioma', account: 'Cuenta', fullscreen: 'Pantalla completa', resolution: 'Resolución de renderizado',
    vsync: 'Fluidez de fotogramas', fpsLimit: 'Límite de FPS', shadowQuality: 'Calidad de sombras',
    textureQuality: 'Calidad de texturas', masterVolume: 'Volumen general', effectsVolume: 'Efectos',
    muteAll: 'Silenciar todo', testSound: 'Probar sonido', soundSaved: 'Los ajustes de sonido se guardan automáticamente.',
    mouseSensitivity: 'Sensibilidad del ratón', invertMouse: 'Invertir ratón', keyBindings: 'Teclas',
    rollDiceKey: 'Tecla de dados', cameraKey: 'Tecla de cámara', newMatchKey: 'Tecla de partida nueva',
    pressKey: 'Pulsa una tecla…', showCrosshair: 'Mostrar mira', cameraDistance: 'Distancia de cámara',
    resetCamera: 'Restablecer cámara', languageLabel: 'Idioma', accountStatus: 'Sesión como Guest Knight',
    logout: 'Cerrar sesión', resetAll: 'Restablecer ajustes', savedNote: 'Los cambios se guardan automáticamente.',
    back: 'Volver',
  },
}

const TAB_KEYS: Readonly<Record<TabName, CopyKey>> = {
  Graphics: 'graphics',
  Audio: 'audio',
  Controls: 'controls',
  Gameplay: 'gameplay',
  Language: 'language',
  Account: 'account',
}

export class SettingsMenu {
  readonly element = panelShell('Settings', 'settings-panel')
  private readonly content = createElement('div', 'settings-content')
  private readonly tabs = createElement('div', 'settings-tabs')
  private readonly tabButtons = new Map<TabName, HTMLButtonElement>()
  private readonly backButton = createButton('Back', 'rpg-button rpg-button-muted settings-back')
  private activeTab: TabName = 'Graphics'

  constructor(private readonly onBack: () => void, private readonly onLogout: () => void) {
    const tabNames: TabName[] = ['Graphics', 'Audio', 'Controls', 'Gameplay', 'Language', 'Account']
    tabNames.forEach((tab) => {
      const button = createButton(tab, 'tab-button')
      button.addEventListener('click', () => {
        this.activeTab = tab
        this.render()
      })
      this.tabButtons.set(tab, button)
      this.tabs.append(button)
    })

    this.backButton.addEventListener('click', this.onBack)
    this.element.append(this.tabs, this.content, this.backButton)

    document.addEventListener('fullscreenchange', () => {
      gameSettings.set('fullscreen', Boolean(document.fullscreenElement))
    })

    gameSettings.subscribe(() => this.render())
  }

  private render(): void {
    const settings = gameSettings.get()
    const copy = COPY[settings.language]
    const cap = this.element.querySelector<HTMLElement>('.stone-cap')
    if (cap) cap.textContent = copy.title
    this.element.setAttribute('aria-label', copy.title)
    document.documentElement.lang = languageCode(settings.language)

    this.tabButtons.forEach((button, tab) => {
      button.textContent = copy[TAB_KEYS[tab]]
      button.classList.toggle('active', tab === this.activeTab)
    })
    this.backButton.textContent = copy.back
    this.content.replaceChildren()

    if (this.activeTab === 'Graphics') {
      this.content.append(
        this.toggle(copy.fullscreen, Boolean(document.fullscreenElement), (checked) => {
          void this.changeFullscreen(checked)
        }),
        this.selectField(copy.resolution, 'resolution', ['1280 x 720', '1920 x 1080', '2560 x 1440', '3840 x 2160'], settings.resolution, (value) => {
          gameSettings.set('resolution', value as ResolutionOption)
        }),
        this.toggle(copy.vsync, settings.vsync, (checked) => gameSettings.set('vsync', checked)),
        this.selectField(copy.fpsLimit, 'fps', ['30', '60', '120', '144', 'Unlimited'], settings.fpsLimit, (value) => {
          gameSettings.set('fpsLimit', value as FpsLimitOption)
        }),
        this.selectField(copy.shadowQuality, 'shadows', ['Off', 'Low', 'Medium', 'High', 'Epic'], settings.shadowQuality, (value) => {
          gameSettings.set('shadowQuality', value as ShadowQualityOption)
        }),
        this.selectField(copy.textureQuality, 'textures', ['Low', 'Medium', 'High', 'Ultra'], settings.textureQuality, (value) => {
          gameSettings.set('textureQuality', value as TextureQualityOption)
        }),
        createElement('p', 'settings-note', copy.savedNote),
      )
    }

    if (this.activeTab === 'Audio') {
      const sound = soundManager.getSettings()
      const testSound = createButton(copy.testSound, 'rpg-button rpg-button-cyan rpg-button-small')
      testSound.addEventListener('click', () => soundManager.test())

      this.content.append(
        this.rangeField(copy.masterVolume, 'master', sound.master, (value) => soundManager.setMasterVolume(value)),
        this.rangeField(copy.effectsVolume, 'effects', sound.effects, (value) => soundManager.setEffectsVolume(value)),
        this.toggle(copy.muteAll, sound.muted, (checked) => soundManager.setMuted(checked)),
        createElement('p', 'settings-note', copy.soundSaved),
        testSound,
      )
    }

    if (this.activeTab === 'Controls') {
      const preset = this.selectField(copy.keyBindings, 'keybindings', ['Default', 'Left Handed', 'Custom'], settings.keyBindings, (value) => {
        gameSettings.set('keyBindings', value as KeyBindingPreset)
      })

      this.content.append(
        this.rangeField(copy.mouseSensitivity, 'mouse', settings.mouseSensitivity, (value) => gameSettings.set('mouseSensitivity', value)),
        this.toggle(copy.invertMouse, settings.invertMouse, (checked) => gameSettings.set('invertMouse', checked)),
        preset,
      )

      if (settings.keyBindings === 'Custom') {
        this.content.append(
          this.keyCaptureField(copy.rollDiceKey, settings.customRollKey, copy.pressKey, (code) => gameSettings.set('customRollKey', code)),
          this.keyCaptureField(copy.cameraKey, settings.customCameraKey, copy.pressKey, (code) => gameSettings.set('customCameraKey', code)),
          this.keyCaptureField(copy.newMatchKey, settings.customNewMatchKey, copy.pressKey, (code) => gameSettings.set('customNewMatchKey', code)),
        )
      }
    }

    if (this.activeTab === 'Gameplay') {
      const resetCamera = createButton(copy.resetCamera, 'rpg-button rpg-button-cyan rpg-button-small')
      resetCamera.addEventListener('click', () => window.dispatchEvent(new Event('city-rivals:reset-camera')))

      this.content.append(
        this.toggle(copy.showCrosshair, settings.showCrosshair, (checked) => gameSettings.set('showCrosshair', checked)),
        this.rangeField(copy.cameraDistance, 'camera', settings.cameraDistance, (value) => gameSettings.set('cameraDistance', value)),
        resetCamera,
      )
    }

    if (this.activeTab === 'Language') {
      this.content.append(this.selectField(
        copy.languageLabel,
        'language',
        ['English', 'Khmer', 'French', 'Japanese', 'Spanish'],
        settings.language,
        (value) => gameSettings.set('language', value as GameLanguage),
      ))
    }

    if (this.activeTab === 'Account') {
      const logout = createButton(copy.logout, 'rpg-button rpg-button-orange')
      logout.addEventListener('click', this.onLogout)
      const reset = createButton(copy.resetAll, 'rpg-button rpg-button-muted')
      reset.addEventListener('click', () => gameSettings.reset())
      this.content.append(createElement('p', 'settings-note', copy.accountStatus), logout, reset)
    }
  }

  private async changeFullscreen(enabled: boolean): Promise<void> {
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen()
      }
      gameSettings.set('fullscreen', Boolean(document.fullscreenElement))
    } catch (error) {
      console.warn('Fullscreen request was blocked by the browser.', error)
      gameSettings.set('fullscreen', Boolean(document.fullscreenElement))
    }
  }

  private toggle(labelText: string, checked: boolean, onChange: (checked: boolean) => void): HTMLLabelElement {
    const control = input(labelText.toLowerCase().replaceAll(' ', '-'), 'checkbox')
    control.checked = checked
    control.addEventListener('change', () => onChange(control.checked))

    const label = createElement('label', 'rpg-switch')
    label.append(createElement('span', '', labelText), control, createElement('i'))
    return label
  }

  private selectField(
    labelText: string,
    name: string,
    values: string[],
    selectedValue: string,
    onChange: (value: string) => void,
  ): HTMLLabelElement {
    const control = select(name, values)
    control.value = selectedValue
    control.addEventListener('change', () => onChange(control.value))
    return field(labelText, control)
  }

  private rangeField(
    labelText: string,
    name: string,
    value: number,
    onInput: (value: number) => void,
  ): HTMLLabelElement {
    const control = this.range(name, value)
    const output = createElement('output', 'settings-range-value', `${value}%`)
    const label = createElement('label', 'rpg-field')
    const heading = createElement('span', 'settings-range-heading')
    heading.append(createElement('span', '', labelText), output)

    control.addEventListener('input', () => {
      const nextValue = Number(control.value)
      output.value = `${nextValue}%`
      output.textContent = `${nextValue}%`
      onInput(nextValue)
    })

    label.append(heading, control)
    return label
  }

  private keyCaptureField(
    labelText: string,
    currentCode: string,
    waitingText: string,
    onCaptured: (code: string) => void,
  ): HTMLLabelElement {
    const label = createElement('label', 'rpg-field settings-key-field')
    const button = createButton(displayKeyCode(currentCode), 'rpg-button rpg-button-muted rpg-button-small')

    button.addEventListener('click', () => {
      button.textContent = waitingText
      button.classList.add('listening')

      const capture = (event: KeyboardEvent): void => {
        event.preventDefault()
        event.stopImmediatePropagation()
        button.classList.remove('listening')
        onCaptured(event.code)
      }

      window.addEventListener('keydown', capture, { once: true, capture: true })
    })

    label.append(createElement('span', '', labelText), button)
    return label
  }

  private range(name: string, value: number): HTMLInputElement {
    const control = input(name, 'range')
    control.min = '1'
    control.max = '100'
    control.value = String(value)
    return control
  }
}
