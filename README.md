# City Rivals

A beginner-friendly **2.5D competitive board game prototype** built with Three.js, TypeScript, and Vite.

The board stays flat and readable while characters jump between tiles, the camera follows the active player, and a live HUD keeps both players' status visible.

## Current prototype

- 24-tile 3D board
- Two local players
- Dice rolling and automatic turn switching
- Character jump animation between tiles
- Camera focus and follow system
- Money, health, property, bank, tax, event, and jail tiles
- Live player status HUD
- Responsive browser layout

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

- **Roll Dice** starts the active player's movement.
- **Board View** returns the camera to the overview position.
- The camera automatically focuses on the active player and follows each jump.

## Planned improvements

- Property purchase confirmation and ownership indicators
- Animated 3D character models
- 3D dice animation
- Character classes and abilities
- Trading and inventory systems
- Sound effects and particles
- Online multiplayer

## Tech stack

- [Three.js](https://threejs.org/)
- TypeScript
- Vite
- HTML and CSS HUD
