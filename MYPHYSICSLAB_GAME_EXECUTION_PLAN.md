# myPhysicsLab 비교 기반 게임 구현 실행계획서

기준일: 2026-03-01  
목표: myPhysicsLab 공개 시뮬레이션 대비 게임 라인업 격차를 단계적으로 축소

## 1. 우선 구현 대상 (Top 6)

1. Roller Coaster with Spring
2. Roller Coaster with Flight
3. Colliding Blocks
4. Polygon Shapes
5. Double Pendulum with Physics Engine
6. Cart + Pendulum with Physics Engine

## 1.1 진행 상태 (2026-03-01)

- [완료] Roller Coaster with Spring
- [완료] Roller Coaster with Flight
- [완료] Colliding Blocks
- [완료] Polygon Shapes
- [완료] Double Pendulum with Physics Engine
- [완료] Cart + Pendulum with Physics Engine

## 2. 단계별 실행 계획

### Phase A: 트랙/충돌 확장 (1~2주, 완료)

대상:
- Roller Coaster with Spring
- Roller Coaster with Flight
- Colliding Blocks

핵심 구현:
- 코스터 카트-스프링 결합(추가 자유도 + 감쇠/강성 파라미터)
- Flight 구간(트랙 이탈 후 포물선/재접촉 처리)
- Colliding Blocks 초기 배치 프리셋 + 재현성 있는 reset

검증:
- 수동 QA: 트랙 이탈/재접촉 안정성, 블록 스택 안정성
- 자동 테스트: 고속 구간 터널링/침투량 회귀 테스트

### Phase B: 형상/접촉 고도화 (2~3주)

대상:
- Polygon Shapes
- Curved Objects (선행 엔진 작업)

핵심 구현:
- 다각형 shape preset + 회전 안정성 튜닝
- 곡선 객체 접촉(근사/세그먼트 기반) 1차 지원

검증:
- SAT 기반 접촉 정합성 테스트
- 장시간 step에서 NaN/폭주 여부 확인

### Phase C: 엔진 기반 진자군 (1~2주)

대상:
- Double Pendulum with Physics Engine
- Cart + Pendulum with Physics Engine

핵심 구현:
- 기존 ODE 모델과 엔진 기반 모델 동시 제공(비교 모드)
- 조인트 파라미터/마찰/제약 반복 수를 UI에서 제어

검증:
- 동일 초기조건에서 ODE vs Engine 궤적 비교 지표 기록
- 장시간 drift/에너지 오차 지표 회귀 추가

## 3. 병행 백로그 (후순위)

- String
- Pendulum Clock
- Dangling Stick
- Rigid Double Pendulum
- Rigid Body Roller Coaster

## 4. 완료 기준 (Definition of Done)

각 게임별 공통 완료 기준:
- 게임 선택 UI 등록 + 파라미터 메뉴 연결
- 기본 프리셋 2개 이상 제공
- `npm test` 회귀 테스트 1개 이상 추가
- `npm run build` 통과
- QA 체크리스트 항목(입력, reset, URL sync, mobile touch) 통과

## 5. 리스크 및 대응

1. 리스크: Flight/Curved 접촉에서 수치 불안정  
대응: 서브스텝 옵션 + CCD fallback 경로 제공

2. 리스크: 신규 shape 도입 시 성능 저하  
대응: broad-phase 셀 크기 자동 조정 및 프리셋별 품질 옵션 분리

3. 리스크: ODE/엔진 병행으로 UX 복잡도 증가  
대응: 비교 모드 UI를 고급 메뉴로 분리

## 6. 실행 순서 요약

1. Phase A 완료
2. Phase B(Polygon 우선) 완료
3. Phase C 완료
4. 후순위 백로그 순차 반영
