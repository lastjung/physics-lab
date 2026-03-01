# AI Orders Board (AI 감독 원본)

## 시작 지시 (재민)

`ai_talk/AI_COLLAB_RULES.md`와 `ai_talk/jaemin-review-loop/SKILL.md`를 먼저 읽고 운영 방식 이해해. 그 다음 `ai_talk/AI_ORDERS_NOW.md`의 `OPEN` 항목만 순서대로 실행해. 완료하면 문서 기록 후 `검토해줘`만 보내.

## 운영 규칙

- 이 파일은 **AI가 직접 업데이트하는 단일 오더 보드**입니다.
- 재민은 이 파일의 `OPEN`/`DOING` 항목만 실행합니다.
- 재민은 우선순위를 바꾸지 않습니다.
- 재민은 구현 후 `검토해줘`로 신호만 보냅니다.
- 검증/판정/기록 업데이트는 AI가 수행합니다.
- 완료 신호 전, `JAEMIN_TASKS.md` 기록을 필수로 합니다.

## 상태 정의

- `OPEN`: 아직 시작 전
- `DOING`: 진행 중
- `BLOCKED`: 막힘 (원인 명시)
- `DONE`: AI 검토까지 통과

## 현재 사이클 (2026-03-01)

### Cycle-1: 리뷰 후 후속 오더

1. [DONE] lifecycle 훅 호출 경로 일원화

- DoD: `main.ts`의 Play/Space/Reset/Step/R/. 경로에서 `onPause/onResume` 호출 일관성 확보
- 산출물: 수정 라인 + 수동 확인 메모

2. [DONE] QA 문서 모순 제거

- DoD: `QA_SMOKE_CHECKLIST.md` 상단/본문 체크 상태 일치, 테스트 수치 최신화(현재 87 PASS)
- 산출물: 문서 diff

3. [DONE] 결과 보고 문서 실기록

- DoD: `JAEMIN_TASKS.md`의 결과 보고 5개 섹션(완료/변경파일/검증/리스크/다음제안) 실제 값 입력
- 산출물: 문서 diff

4. [DONE] 전체 검증 재실행

- DoD: `pnpm test` PASS, `pnpm build` SUCCESS 로그 확인
- 산출물: 실행 결과 요약

### Cycle-2: 다음 할 일

1. [DONE] 모바일 UX 마감

- DoD: 바텀시트 열기/닫기 안정화 + 터치 타겟 확대 + 모바일 해상도(390x844 기준) 주요 조작 3개 정상 동작
- 산출물: 변경 파일 목록 + 동작 체크 항목

2. [DONE] 문서 동기화

- DoD: `PROJECT_PLAN.md`, `PHASE3_5_RELEASE_NOTES.md` 최신 구현 상태/테스트 수치(현재 87 PASS) 반영
- 산출물: 문서 diff 요약

3. [DONE] Phase 4 킥오프 태스크 분해

- DoD: `Joint Motor/Limit/Slider/Scene Editor`를 1~2일 단위 작업으로 분해, 우선순위/의존성 명시
- 산출물: 신규 계획 문서 1개 또는 기존 계획 문서 섹션 추가

4. [DONE] Prismatic 안정성 회귀 보강

- DoD: 극단 질량비/고속 입력 조건 테스트 2개 이상 추가 + `pnpm test` PASS
- 산출물: 테스트 파일 diff + 실패 재현 조건(있다면) 기록

### Cycle-3: 다음 오더

1. [DONE] 문서 수치 최종 정합화

- DoD: `QA_SMOKE_CHECKLIST.md`, `PHASE3_5_RELEASE_NOTES.md`, `PROJECT_PLAN.md`의 테스트/상태 수치가 현재 실행 결과와 완전히 일치
- 산출물: 문서 3개 diff 요약

2. [DONE] Scene Editor Phase-4 스캐폴드 착수

- DoD: 최소 기능(객체 선택 or Circle 생성) 1개를 `src/plugins`/`src/simulations`에 연결해 실행 가능 상태
- 산출물: 신규 파일 + 프리셋 등록 + 실행 방법 3줄

3. [DONE] Phase-4 회귀 테스트 베이스라인 추가

- DoD: Scene Editor/신규 메커니즘용 스모크 테스트 2개 이상 추가, 기존 테스트 포함 전체 PASS
- 산출물: 테스트 파일 diff + 테스트 명세 요약

4. [DONE] UI 접근성 1차 점검

- DoD: 키보드 포커스/버튼 라벨/모바일 메뉴 접근성 최소 3개 항목 점검 및 수정
- 산출물: 수정 파일 목록 + 점검 항목 체크리스트

### Cycle-4: 대량 백로그 오더 (연속 수행)

1. [OPEN] Scene Editor 선택/생성 1차 완성

- DoD: Circle/Box 생성 + 선택 + 이동(드래그)까지 동작, 프리셋에서 실행 가능
- 산출물: 신규 시뮬레이션/플러그인 파일 + 실행 절차

2. [OPEN] Scene 저장/불러오기(localStorage)

- DoD: 현재 장면을 저장 후 새로고침해도 복원
- 산출물: JSON 스키마 + 저장/로드 코드 + 실패 케이스 1개 대응

3. [OPEN] Scene 파일 Import/Export

- DoD: JSON 다운로드/업로드 가능, 잘못된 JSON 입력 시 에러 처리
- 산출물: UI 버튼 + 파서/검증 로직

4. [OPEN] Joint 에디터 UI

- DoD: Revolute/Prismatic 생성 및 핵심 파라미터 편집 가능
- 산출물: 조인트 생성/편집 패널 + 상태 반영 코드

5. [OPEN] Wheel Joint 초안 구현

- DoD: Prismatic + spring/damper 조합으로 2륜 데모 동작
- 산출물: `solveWheelJoint`(또는 동등 구조) + 데모 프리셋

6. [OPEN] Weld Joint 구현

- DoD: 2개 바디를 강체처럼 고정, 분리/흔들림 최소화
- 산출물: 솔버 + 회귀 테스트 2개 이상

7. [OPEN] Polygon CCD 조사 및 스캐폴드

- DoD: 최소 TOI 계산 경로 1개 추가, 실패 케이스 문서화
- 산출물: 코드 초안 + 리스크 메모

8. [OPEN] Physics Sub-stepping 옵션화

- DoD: 스텝 분할(예: 1/2/4) 선택 가능, 고속 충돌 안정성 비교 가능
- 산출물: 옵션 파라미터 + 비교 결과 기록

9. [OPEN] 모바일 UX 2차 마감

- DoD: 바텀시트/오버레이/버튼 터치 영역 최적화, 390x844/430x932 확인
- 산출물: 체크리스트 + 수정 파일

10. [OPEN] 접근성 2차 점검

- DoD: keyboard-only 조작 경로 보장, aria-label 누락 0건
- 산출물: 점검표 + 수정 파일

11. [OPEN] 테스트 인프라 정리

- DoD: 조인트 테스트를 파일 분리(기능군별), 공통 fixture 정리
- 산출물: 테스트 구조 리팩터링 + 전체 PASS

12. [OPEN] 문서/릴리즈 정리

- DoD: `PROJECT_PLAN.md`, `PHASE3_5_RELEASE_NOTES.md`, `QA_SMOKE_CHECKLIST.md` 최신 상태 동기화
- 산출물: 문서 diff + 변경 요약 10줄 이내

## 금지

- "내가 감독" 식으로 범위/우선순위 임의 변경 금지
- 테스트/빌드 미검증 상태에서 완료 주장 금지

## AI 전용 섹션 (재민 수정 금지)

- 마지막 검증 시각: 2026-03-01 (pnpm test 91 PASS / pnpm build SUCCESS)
- 마지막 판정: Cycle-3 DONE (Phase 4 킥오프 완료)
- 다음 오더 발행 시각: (Cycle-4 대기 중)
