# Phase 3.5 Release Notes: Advanced Dynamics & Chaos

Phase 3.5 introduces significant enhancements to the physics engine core and adds new high-level simulations that demonstrate constraints and chaotic behavior.

## 1. New Features Summary

- **Engine**:
  - Dynamic Spatial Hashing Broad-phase implemented for improved performance in crowded scenes.
  - CCD (Continuous Collision Detection) for Circle-AABB and AABB-AABB to prevent tunneling.
  - Joint & Constraint Solver (Distance, Revolute, Prismatic) using Baumgarte stabilization.
  - Joint Motor & Limits: Angular and linear drive/limit functionality implemented.
  - **Wheel Joint**: Advanced 2D vehicle suspension with soft constraints (stiffness/damping) and motor drive.
  - **Physics Sub-stepping**: Fixed update support (1x/2x/4x/8x) for high-frequency physics stability.
  - **Polygon CCD Scaffold**: Initial TOI (Time of Impact) estimation for polygon shapes to reduce high-velocity tunneling.
- **Simulations**:
  - **Hanging Chain**: Interactive multi-node chain with distance joints.
  - **Pile Attract**: Large-scale particle simulation with inverse-square attraction.
- **Analysis Tool**:
  - **Chaos Compare (Double Pendulum)**: Real-time Lyapunov exponent estimation and phase space divergence visualization. Plus IK-based dragging interaction.

## 2. Performance & Stability Metrics

- **Broad-phase**: Spatial Hash reduction vs Brute-force: **~99.98%** (N=1000).
- **CCD Accuracy**: Catching tunneling at velocities of 150+ units/sec where discrete methods miss.
- **Stability**: Stacking stability improved with manifold contact support (SAT).

## 3. Stability Indicators

- **Regression Tests**: Total **109** tests.
- **Status**: **PASSING** (including Joint Motor/Limit, Prismatic, and Wheel Joint stability).

## 남은 리스크 (Remaining Risks)

1. **Polygon CCD 한계**: 폴리곤 간 초기 CCD(Scaffold)가 구현되었으나, 회전성 터널링(Rotational Tunneling)은 아직 완벽히 방어되지 않아 초고속 회전체 충돌 시 오차가 발생할 수 있습니다.
2. **대규모 장면 최적화 부재**: Spatial Hashing을 도입했으나, 엔진 전반의 병렬 연산(Web Worker/GPU)은 차기 과제로 남아 있습니다.

## 마무리 보고

- **테스트**: 109개 PASS
- **빌드**: Vite Build SUCCESS
- **버전**: Phase 3.5 Stable
