# Engine2D Phase 2 개발 요약

Phase 2에서는 물리 엔진의 안정성, 성능, 그리고 정밀도를 대폭 향상시켰습니다.

## 🚀 주요 구현 기능

1.  **Contact Manifolds (다중 접점)**
    - 박스 간 충돌 시 최대 2개의 접점을 생성하여 회전 및 적층 안정성 확보.
    - Warm Starting을 접점별로 캐싱하여 프레임 간 임펄스 유지 성능 개선.

2.  **Rotation & Inertia (회전 물리)**
    - 각운동량(Angular Momentum) 및 관성 모멘트(Inertia) 도입.
    - 충격 지점에 따른 토크(Torque) 계산 및 회전 효과 구현.
    - Baumgarte 안정화 로직에 각도 보정 추가.

3.  **Broad-phase Optimization (공간 최적화)**
    - Uniform Grid를 이용한 공간 분할 알고리즘 구현.
    - 충돌 후보군을 $O(N \log N)$ 수준으로 절감 (N=500 기준 후보쌍 99.9% 감소).
    - Swept AABB를 적용하여 CCD와 호환성 확보.

4.  **Continuous Collision Detection (CCD - Circle-Circle)**
    - 고속 물체의 터널링(Tunneling) 방지를 위한 TOI(Time of Impact) 계산 로직 추가.
    - discrete 방식에서 놓치는 충돌을 정확히 검출.

## ✅ 테스트 현황

- **총 테스트 케이스**: 56개 (모두 PASS)
- **주요 확인 사항**:
  - High-speed tunneling 케이스 검출 확인.
  - 3단 적층 박스의 120프레임 정적 안정성 유지.
  - Off-center 충돌 시 회전각 발생 검증.

## 🚨 남은 리스크 및 향후 계획

- **CCD 확장**: Circle-AABB 및 AABB-AABB에 대한 CCD 확장이 필요합니다.
- **Broad-phase 튜닝**: 객체 크기에 따른 동적 셀 크기 조정 도입 검토.
