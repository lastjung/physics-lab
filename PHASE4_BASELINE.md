# Phase 4 Baseline (2026-03-01)

## 목적

Phase 4(Advanced Mechanisms) 진행 중 완료 기준을 고정하고, 릴리스 전 검증 항목을 팀 공통으로 맞춘다.

## 1) 정확성 기준 (Correctness)

- Joint 제약 위반 오차: 일반 장면에서 anchor 오차가 눈에 띄게 누적되지 않을 것.
- Revolute limit: 장시간 구동에서 설정 범위를 지속적으로 이탈하지 않을 것.
- Prismatic limit: 고속 입력에서도 상/하한을 반복적으로 뚫지 않을 것.
- 전체 스텝 중 상태값(`x,y,vx,vy,angle,omega`)에 `NaN/Infinity`가 발생하지 않을 것.

## 2) 성능 기준 (Performance)

- 기본 데모 해상도(Desktop)에서 Scene Editor 조작 시 프레임 드랍이 체감되지 않을 것.
- Broad-phase 효율성 기준 유지: N=1000 케이스에서 brute-force 대비 pair 수가 유의미하게 감소할 것.
- 회귀 테스트 전체 실행 시간이 로컬 기준에서 과도하게 증가하지 않을 것.

## 3) 자동 검증 기준 (Test Gate)

- `npm test` 전체 통과: 100 PASS (2026-03-01 기준).
- 신규 스트레스 테스트 통과:
  - `test/engine2d-joints.test.ts`의 long-run revolute/prismatic stress
  - `test/scene-editor.test.ts`의 scene format version / legacy deserialize
- `npm run build` 성공.

## 4) 수동 QA 체크리스트 (Scene Editor)

- Body 생성/선택/드래그 이후 저장-새로고침 시 상태가 유지되는지 확인.
- Joint 생성 후 속성(motor/limit)을 조정하면 즉시 동작에 반영되는지 확인.
- Export/Import JSON 왕복 후 body/joint/params가 유지되는지 확인.
- 중력값 변경 후 다시 로드해도 값이 유지되는지 확인.

## 5) 남은 우선 작업

- 조인트 속성 패널의 입력 유효성/단위 UX(각도, 힘, 토크) 추가 개선.
- Scene Editor 조작 완성도(다중 선택, 스냅, 기즈모) 고도화.
- 대규모 장면 렌더 최적화(불필요 redraw 최소화).
