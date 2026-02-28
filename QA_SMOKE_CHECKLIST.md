# QA Smoke Checklist: Phase 3.5

## 1. Interaction & UI

- [ ] **Mobile Bottom-sheet**: Open preset menu on mobile resolution. Verify close button works.
- [ ] **Touch Drag**:
  - [ ] Drag nodes in `Hanging Chain`.
  - [ ] Drag attractor in `Pile Attract`.
  - [ ] Drag pendulum end in `Chaos Compare`.
- [ ] **URL Sync**: Change a parameter (e.g., damping) and refresh. Value should persist.

## 2. Performance

- [ ] **Pile Attract N=200**: Increase particle count to 200. Verify FPS stays above 30 on desktop.
- [ ] **Broad-phase Check**: Verify there is no frame-stutter when many particles cluster in the center.

## 3. Correctness

- [ ] **HUD Check**: Statistics (Distance, Time, λ) should be finite numbers.
- [ ] **Reset Sync**: Press "Sync Reset" in Chaos Compare. Both pendulums must perfectly overlap at t=0.

## 4. Verification Commands

- **Unit Tests**: `pnpm test` (Must see 73 PASS)
- **Production Build**: `pnpm build` (Must complete without errors)
