# Engine2D Collision Pipeline Checklist

- [x] 감지/해결/안정화 함수 분리 완료 (detect, resolve, stabilize)
- [x] 각 단계 I/O 타입 고정 (BodyState, Contact)
- [x] 단위테스트 3개 통과
- [x] Narrow-phase 실제 알고리즘 구현 (Circle-Circle SAT)
- [x] Circle-AABB 충돌 감지/처리 완료
- [x] Baumgarte Position Correction 구현 완료
- [x] Iterative solver (N회 반복) 구현 완료
- [x] Friction tangent impulse 구현 완료
- [x] Warm Starting 구현 완료
- [ ] AABB-AABB narrow phase 구현 (TODO)

## 다음 릴리즈 우선순위

1. **AABB-AABB narrow phase**: 박스-박스 간의 정밀한 충돌 감지 로직 추가.
2. **Stacking stability tuning**: 적층 상태의 안정성을 위한 iterations/fixedDt 파라미터 최적화.
3. **Contact manifold/Warm-start quality 개선**: 다중 접촉점 처리 및 Warm starting 품질 향상을 통한 떨림(jitter) 제거.
