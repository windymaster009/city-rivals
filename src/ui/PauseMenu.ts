import { createButton, panelShell } from './dom'

export class PauseMenu {
  readonly element = panelShell('Paused', 'pause-panel')

  constructor(onResume: () => void, onSettings: () => void, onLeaveMatch: () => void, onExit: () => void) {
    const resume = createButton('Resume', 'rpg-button rpg-button-green')
    const settings = createButton('Settings', 'rpg-button')
    const leave = createButton('Leave Match', 'rpg-button rpg-button-orange')
    const exit = createButton('Exit Game', 'rpg-button rpg-button-muted')
    resume.addEventListener('click', onResume)
    settings.addEventListener('click', onSettings)
    leave.addEventListener('click', onLeaveMatch)
    exit.addEventListener('click', onExit)
    this.element.append(resume, settings, leave, exit)
  }
}
