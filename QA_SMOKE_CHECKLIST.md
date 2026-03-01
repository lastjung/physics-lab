# QA Smoke Checklist: Phase 3.5

## Run Status (2026-03-01)

- [x] **Mobile Bottom-sheet**: 확인 완료 (수동 조작성 개선 반영)
- [x] **Touch Drag (Hanging Chain / Pile Attract / Chaos Compare)**: 동작 확인 (Pointer API 호환)
- [x] **URL Sync**: 자동 테스트 추가 및 통과 (`test/url-state.test.ts`)
- [x] **Pile Attract N=200 FPS 30+**: 성능 측정 완료 (Vite Build 기준 안정적)
- [x] **Broad-phase frame-stutter**: 확인 완료 (Spatial Hashing 효율성 검증)
- [x] **HUD finite numbers**: 관련 회귀 테스트 통과
- [x] **Chaos Compare Sync Reset**: 동작 수정 + 자동 테스트 통과
- [x] **Unit Tests**: `pnpm test` 통과 (87 PASS)
- [x] **Production Build**: `pnpm build` 성공

## 1. Interaction & UI

- [x] **Mobile Bottom-sheet**: Open preset menu on mobile resolution. Verify close button works.
- [x] **Touch Drag**:
  - [x] Drag nodes in `Hanging Chain`.
  - [x] Drag attractor in `Pile Attract`.
  - [x] Drag pendulum end in `Chaos Compare`.
- [x] **URL Sync**: Change a parameter (e.g., damping) and refresh. Value should persist.

## 2. Performance

- [x] **Pile Attract N=200**: Increase particle count to 200. Verify FPS stays above 30 on desktop.
- [x] **Broad-phase Check**: Verify there is no frame-stutter when many particles cluster in the center.

## 3. Correctness

- [x] **HUD Check**: Statistics (Distance, Time, λ) should be finite numbers.
- [x] **Reset Sync**: Press "Sync Reset" in Chaos Compare. Both pendulums must perfectly overlap at t=0.

## 4. Verification Commands

- **Unit Tests**: `pnpm test` (87 PASS)
- **Production Build**: `pnpm build` (SUCCESS)
