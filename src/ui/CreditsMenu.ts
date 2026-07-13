import '../../styles/credits.css'
import { createButton, createElement, panelShell } from './dom'

interface CreditLink {
  label: string
  handle: string
  url: string
}

interface Contributor {
  name: string
  initials: string
  role: string
  contribution: string
  links: CreditLink[]
  featured?: boolean
  founder?: boolean
}

/**
 * Add future helpers here. The Credits screen renders this list automatically.
 */
const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    founder: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
   {
    name: 'MEAS PUTTIVIREAK',
    initials: 'MP',
    role: 'Creator & Developer',
    contribution:
      'game concept, Cambodian board-game research, game design, node.js development.',
    featured: true,
    founder: true,
    links: [
      {
        label: 'GitHub',
        handle: '@MEROW-git',
        url: 'https://github.com/MEROW-git',
      },
    ],
  },
   {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
   {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
  {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
   {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
   {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
   {
    name: 'Windy',
    initials: 'WK',
    role: 'Creator & Lead Developer',
    contribution:
      'Original game concept, Cambodian board-game research, game design, Three.js development, and project direction.',
    featured: true,
    links: [
      {
        label: 'GitHub',
        handle: '@windymaster009',
        url: 'https://github.com/windymaster009',
      },
    ],
  },
]

export class CreditsMenu {
  readonly element = panelShell('Credits', 'credits-panel')

  constructor(onBack: () => void) {
    const heading = createElement('div', 'credits-heading')
    heading.append(
      createElement('span', 'credits-kicker', 'THE PEOPLE BEHIND THE BOARD'),
      createElement('h2', '', 'Made with heart in Cambodia'),
      createElement(
        'p',
        '',
        'City Rivals is being built with help from people who share ideas, rules, art, code, testing, and encouragement.',
      ),
    )

    const contributorGrid = createElement('div', 'credits-grid')
    CONTRIBUTORS.forEach((contributor) => {
      contributorGrid.append(this.createContributorCard(contributor))
    })

    const futureCard = createElement('article', 'credit-card credit-card-future')
    futureCard.append(
      createElement('div', 'credit-avatar credit-avatar-empty', '+'),
      createElement('h3', '', 'More helpers coming soon'),
      createElement(
        'p',
        '',
        'Game-rule researchers, artists, testers, translators, and community contributors will be listed here with their permission.',
      ),
    )

    const back = createButton('Back', 'rpg-button rpg-button-muted credits-back')
    back.addEventListener('click', onBack)

    this.element.append(heading, contributorGrid, futureCard, back)
  }

  private createContributorCard(contributor: Contributor): HTMLElement {
    const card = createElement(
      'article',
      `credit-card${contributor.featured ? ' credit-card-featured' : ''}`,
    )

    const avatar = createElement('div', 'credit-avatar', contributor.initials)
    avatar.setAttribute('aria-hidden', 'true')

    const identity = createElement('div', 'credit-identity')
    identity.append(
      createElement('h3', '', contributor.name),
      createElement('span', 'credit-role', contributor.role),
    )

    const header = createElement('div', 'credit-card-header')
    header.append(avatar, identity)

    if (contributor.founder) {
      card.append(createElement('span', 'credit-founder-badge', 'Founder'))
    }

    const contribution = createElement('p', 'credit-contribution', contributor.contribution)
    const links = createElement('div', 'credit-links')

    contributor.links.forEach((link) => {
      const anchor = createElement('a', 'credit-link')
      anchor.href = link.url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.setAttribute('aria-label', `${contributor.name} on ${link.label}`)
      anchor.append(
        createElement('span', 'credit-link-label', link.label),
        createElement('strong', '', link.handle),
      )
      links.append(anchor)
    })

    card.append(header, contribution, links)
    return card
  }
}
