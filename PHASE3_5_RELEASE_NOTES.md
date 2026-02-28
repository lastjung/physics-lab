# Phase 3.5 Release Notes: Advanced Dynamics & Chaos

Phase 3.5 introduces significant enhancements to the physics engine core and adds new high-level simulations that demonstrate constraints and chaotic behavior.

## 1. New Features Summary

- **Engine**:
  - Dynamic Spatial Hashing Broad-phase implemented for improved performance in crowded scenes.
  - CCD (Continuous Collision Detection) for Circle-AABB and AABB-AABB to prevent tunneling.
  - Joint & Constraint Solver (Distance, Revolute) using Baumgarte stabilization.
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

- **Regression Tests**: Total **73** tests.
- **Status**: **PASSING** (including energy conservation and period accuracy for basic systems).

## 남은 리스크 (Remaining Risks)

1. **Polygon CCD 미구현**: 일반 다각형에 대한 연속 충돌 감지(Continuous Collision Detection)가 적용되지 않아 초고속 이동 시 터널링 발생 가능성이 있습니다.
2. **Joint Motor/Limit 미구현**: Revolute Joint 등에 회전 한계(Limit)나 동력(Motor) 기능이 없어 복잡한 기계 장치 구현에 제약이 있습니다.
3. **대규모 장면 최적화 부재**: Spatial Hashing을 도입했으나, 수만 개 이상의 객체가 있는 장면을 위한 Quadtree 또는 병렬 연산(Web Worker/GPU)은 아직 적용되지 않았습니다.

## 마무리 보고

- **테스트**: 73개 PASS
- **빌드**: Vite Build SUCCESS
- **버전**: Phase 3.5 Alpha
