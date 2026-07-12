# IT Manager Simulator

A playable low-poly, first-person browser-game vertical slice about managing an IT department in a chaotic startup.

## Play online

The GitHub Pages deployment is configured at:

https://krisraves.github.io/IT-Manager-Simulator-/

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Enter the office**, then use WASD and the mouse. Press **E** to interact and **Tab** to open the management console.

## Production build

```bash
npm run test
npm run build
```

The static build is written to `dist/` and can be hosted on any static web server.

## Included systems

- Low-poly Three.js office with FPS movement, pointer lock, raycast interactions, and simple collisions
- Four technicians with skills, traits, morale, stress, fatigue, and work assignments
- Ticket queue with severity, skill requirements, progress, hidden complexity, SLA breaches, and failed fixes
- Scripted incidents and management decisions with delayed metric consequences
- Budget purchases, training, office interactions, live metrics, activity feed, and end-of-day score
- Seeded simulation, fixed ticks, IndexedDB saves with localStorage fallback, and Vitest coverage
