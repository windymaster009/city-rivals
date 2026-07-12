# City Rivals

A 2.5D browser prototype inspired by an old Cambodian survival board game that has not yet been recreated digitally.

The project uses a flat, readable board with animated 3D characters, two-dice movement, camera following, and an HTML/CSS match HUD.

## Current foundation

- 7 × 9 board with 63 placeholder tiles
- Snake movement path beginning at the top-right
- First row moves right-to-left, then every row alternates direction
- Path repeats after tile 63
- Match setup for 2–6 local players
- Custom player names and starting money
- Every player starts with 5 hearts
- Empty per-player inventory ready for real items
- Two-dice rolling and automatic turn switching
- Character jump animation and active-player camera follow
- Lap counting
- Elimination and last-survivor winner logic prepared
- No player-vs-player attacks

The special tile rules are intentionally not implemented yet. The authentic board will be mapped row by row before adding rewards, dangers, protection items, heart recovery, and money effects.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, normally:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
npm run preview
```

## Controls

- **Roll 2 Dice** moves the active player by the combined result.
- **Board View** switches between the overview and active-player camera.
- **New Match** returns to the 2–6 player setup screen.

## Planned next steps

- Map all 63 authentic tiles row by row
- Add item collection and private inventory rules
- Add heart-loss dangers such as Ghost
- Add protection relationships such as Monk versus Ghost
- Add paid heart recovery and money rewards or penalties
- Add skip-turn, jail, movement, and transportation effects
- Replace placeholder characters and tile art
- Add online multiplayer after the local rule set is complete

## Tech stack

- Three.js
- TypeScript
- Vite
- HTML and CSS HUD
