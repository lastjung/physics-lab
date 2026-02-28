# Engine2D Phase 1 Summary: Collision & Response

## 1. 이번 단계 구현 목록

- **3단계 충돌 파이프라인**: Detect(감지), Resolve(해결), Stabilize(안정화) 모듈화 구현.
- **Narrow-phase 구현**: Circle-Circle 및 Circle-AABB(SAT 기반) 충돌 검사 알고리즘 적용.
- **임펄스 모델**: 반발계수(Restitution)를 반영한 순시 임펄스 계산 로직.
- **마찰력(Friction)**: 쿨롱 마찰(Coulomb) 기반의 접선 임펄스 및 클램핑 적용.
- **Baumgarte 안정화**: 침투(Penetration) 깊이에 따른 위치 보정 로직(`beta=0.2`).
- **Iterative Solver**: 한 스텝 내 다중 반복(기본 4회)을 통한 제약 조건 수렴도 향상.
- **Warm Starting**: 프레임 간 임펄스 캐싱 및 초기 선적용을 통한 안정성 확보.
- **수치 안정성**: NaN/Infinity 방지 처리 및 Stable Contact ID 생성.

## 2. 테스트 현황

- **총 테스트 케이스**: 22개 (Collision Pipeline 관련)
- **전체 결과**: **ALL PASS**
- **회귀 지표**: 탄성 충돌 시 속도 교환 확인, 비탄성 충돌 시 상대 속도 0 수렴 확인, 마찰력에 의한 속도 감소 검증 완료.

## 3. 확인된 리스크

- **AABB-AABB 미구현**: 박스 간의 충돌 검사가 아직 구현되지 않아 구체의 보조 수단으로만 박스 사용 가능.
- **Jittering (떨림)**: 침투 해소(Baumgarte)와 임펄스 해결 사이의 수치적 간섭으로 인해 고속 충돌 또는 정지 상태에서 미세한 떨림 발생 가능.

## 4. Phase 2 목표

1. **AABB-AABB Narrow Phase**: 박스 간 충돌의 모든 케이스를 지원하도록 알고리즘 확장.
2. **Contact Manifold 생성**: 접촉점(Contact Point) 리스트를 생성하여 한 면에 걸친 다중 접촉 처리.
3. **Broad-phase 최적화**: Grid 또는 AABB Tree를 도입하여 O(N^2) 검사를 개선하고 대규모 개체 처리 기틀 마련.

## 5. 최종 문서 경로

- `REGRESSION_POLICY.md`
- `ENGINE2D_COLLISION_CHECKLIST.md`
- `ENGINE2D_PHASE1_SUMMARY.md`
