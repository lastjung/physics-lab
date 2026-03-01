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

## 금지

- "내가 감독" 식으로 범위/우선순위 임의 변경 금지
- 테스트/빌드 미검증 상태에서 완료 주장 금지

## AI 전용 섹션 (재민 수정 금지)

- 마지막 검증 시각: 2026-03-01 (pnpm test 87 PASS / pnpm build SUCCESS)
- 마지막 판정: Cycle-2 DONE
- 다음 오더 발행 시각: (Cycle-3 대기 중)
