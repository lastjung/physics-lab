# Physics Lab

Expandable physics simulation sandbox inspired by myPhysicsLab.
Current MVP includes:
- Damped/Ideal Pendulum
- Spring-Mass oscillator
- Double Pendulum / Driven Pendulum / Coupled Spring
- Orbit / Collision Lab / Newton's Cradle
- Cart + Pendulum / Roller Coaster
- RK4 integration, canvas rendering, interactive controls
- AppShell architecture with global menu + per-game menu separation

## Requirements

- Node.js 20+
- pnpm 10+ (or npm)

## Run (Development)

```bash
cd /Users/eric/PG/physics-lab
pnpm install
pnpm run dev
```

Open `http://localhost:5173`.

## Build

```bash
pnpm run build
pnpm run preview
```

Preview server runs on `http://localhost:4173` by default.

## Controls

### Mouse

- Drag the blue bob to set pendulum angle directly.
- If simulation was playing before drag, it resumes automatically after release.
- In `Spring Mass`, drag the blue block horizontally to set displacement.

### Keyboard

- `Space`: Play/Pause toggle
- `R`: Reset simulation
- `.`: Step forward 1 fixed step
- `Shift + .`: Step forward 2 fixed steps

### Menu Structure

- `Global Controls`: play/pause/reset/step/status (shared across all games)
- `Per-game Controls`: only game-specific parameters (pendulum or spring)
- `Per-game Controls`: game-specific parameters and interactions
- On mobile, menu is collapsible via the `Menu` button

## URL State and Presets

- Preset selector is shown above controls (`Damped Pendulum`, `Ideal Pendulum`, `Spring Mass`).
- Current simulation state is written to URL query params, so copy/paste URL reproduces the same setup.
- Supported query keys:
  - `sim`: preset id
  - `l,g,d,m`: length, gravity, damping, mass
  - `ia,iw`: initial angle, initial angular velocity
  - `th,om`: current angle, current angular velocity

## Project Structure

- `src/core`: engine interfaces, runner, integrator
- `src/simulations`: physics models (pendulum, spring-mass)
- `src/render`: canvas renderers
- `src/ui`: game-specific parameter controls
- `src/plugins`: `GamePlugin` implementations (per-game runtime wiring)
- `test`: unit tests

## Notes

- Use Vite dev server for TypeScript source (`pnpm run dev`).
- Static servers should serve built `dist/` output, not raw `src/`.
