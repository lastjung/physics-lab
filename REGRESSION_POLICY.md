# Physics Lab Regression Policy

## Overview

이 문서는 물리 시뮬레이션의 수치적 정확성과 안정성을 보장하기 위한 회귀 테스트 정책을 정의합니다. 모든 임계값은 [regressionThresholds.ts](file:///Users/eric/PG/physics-lab/test/regressionThresholds.ts)에서 통합 관리됩니다.

## Thresholds & Standards

| Simulation          | Metric                  | Threshold         | Why this threshold                                         | Last Measured Value     |
| :------------------ | :---------------------- | :---------------- | :--------------------------------------------------------- | :---------------------- |
| **Spring Mass**     | Period Rel Error        | < 0.01 (1%)       | RK4의 시간적 정밀도 보장                                   | 0.00027 (0.027%)        |
| **Spring Mass**     | Energy Drift (Undamped) | < 0.005 (0.5%)    | 장기 실행 시 에너지 보존 법칙 준수 확인                    | 8.47e-9 (~0.000001%)    |
| **Damped Pendulum** | Decay Ratio             | < 0.5             | 24초 후 진폭이 절반 이하로 감소하는지 확인                 | 0.144 (14.4%)           |
| **Damped Pendulum** | Non-Increasing count    | >= 6 / 8 segments | 진폭 외피가 단조 감소하는지 확인                           | 7 / 7 segments          |
| **Damped Pendulum** | End Energy Ratio        | < 0.25            | 30초 후 에너지가 충분히 소산(75% 이상)되는지 확인          | 0.0046 (0.46%)          |
| **Damped Pendulum** | Up Spike Ratio          | < 0.002           | 감쇠 시스템에서 에너지가 비정상적으로 증가하지 않는지 확인 | 0 (None)                |
| **Orbit**           | Energy Drift            | < 0.015 (1.5%)    | 행성 궤도의 이심률 및 안정성 유지 확인                     | 1.08e-9 (~0.0000001%)   |
| **Orbit**           | Angular Momentum Drift  | < 0.015 (1.5%)    | 중심력 시스템에서의 각운동량 보존 확인                     | 4.62e-10 (~0.00000004%) |

## Engine2D Collision System

| Component | Logic | Configuration | Note |
| Component | Logic | Configuration | Note |
| :----------------- | :----------------------------- | :-------------------- | :------------------------------ |
| Broad Phase | Dynamic Spatial Hashing | cellSize auto-tuning | reduction > 90% in sparse scenes|
| Pipeline | Detect -> Resolve -> Stabilize | 3-stage modular | decoupled physics steps |
| Velocity Loop | Sequential Impulse (Rotation) | Default: 8 iterations | v + omega x r relative velocity |
| Position Loop | Baumgarte (Rotation) | Default: 6 iterations | resolves penetration & angle |
| Warm Starting | Multi-point caching | Default: ON | indexed per manifold point |
| Friction Model | Tangential Impulse | `jt <= mu * j` | applies both linear/angular |
| Narrow Phase | Circle, AABB, Polygon SAT | SAT-based 2-point | rotation-ready contact points |
| CCD (Continuous) | Swept Circle/AABB Slab | 0..1 TOI normalization | tunneling prevention for all |
| Joints | Distance, Revolute | Velocity/Position solver | dynamic constraints support |

- **Body State**: Requires `angle`, `omega`, `inertia`, `invInertia` for all dynamic objects.
- **Baumgarte Correction**: Default `beta=0.18`, `slop=0.005`.
- **Contact Management**: Sorted ID key (`aId:bId`) for persistent caching.
- **Verification**: Pipeline tests must maintain 0 NaN/Infinity and correct velocity exchange for elastic cases.

## Execution

모든 회귀 테스트(**총 73개**)는 아래 명령으로 실행할 수 있습니다:

```bash
pnpm test
```

## Phase 3.5 Verification Notes

- **Hanging Chain**: 300스텝 후 앵커 위치 고정 및 전체 상태 유한성 검사 완료.
- **Pile Attract**: 인력에 의한 평균 반경 감소 경향성 및 입자 간 중점 방지 검사 완료.
- **Chaos Compare**: Epsilon 오차에 따른 위상 공간 거리의 지수적 발산(Lyapunov > 0) 수치 검증 완료.
