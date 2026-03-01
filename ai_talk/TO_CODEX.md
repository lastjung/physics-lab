# TO_CODEX (필독)

## 목적
이 프로젝트의 AI-재민 협업 루프를 다음 Codex 인스턴스가 즉시 이어받기 위한 인수인계 문서.

## 반드시 읽을 파일 순서
1. `ai_talk/AI_COLLAB_RULES.md`
2. `ai_talk/jaemin-review-loop/SKILL.md`
3. `ai_talk/CODE_ORDER.md`
4. `ai_talk/CODE_ALL_ORDER.md`
5. `ai_talk/CODE_TRIGGER.md`

## 운영 원칙
- 감독/우선순위 결정: AI
- 실행/구현: 재민
- 단일 오더 원본: `ai_talk/CODE_ORDER.md`
- 전체 백로그 원본: `ai_talk/CODE_ALL_ORDER.md`
- 재민 신호 문구: `검토해줘`
- 파일 분리:
  - 오더: `CODE_ORDER.md`
  - 트리거: `CODE_TRIGGER.md`
  - 리뷰 결과: `REVIEW_RESULT.md`

## Codex 작업 절차
1. `CODE_ORDER.md`의 현재 오더 확인 후 `CODE_ALL_ORDER.md`의 사이클 상태 확인
2. 재민이 `검토해줘` 요청 시 코드/문서/테스트 검증 수행
3. 결과를 `Findings -> Orders -> Verify -> Report` 포맷으로 회신
4. 검증 결과를 반영해 `CODE_ORDER.md`와 `CODE_ALL_ORDER.md`를 함께 갱신

## 다음 세션 우선 작업 (자동화)
- 사용자 확정 지시(2026-03-01): **다음 세션 시작 즉시 자동화 마무리를 최우선으로 수행할 것.**
- 목표: 반자동 -> 완전자동 전환
- 구현 대상:
  1. `CODE_TRIGGER.md` 저장 감지 시 자동 리뷰 실행 (`test/build`)
  2. 결과 판정 후 `CODE_ALL_ORDER.md` 상태 자동 전환 (`DOING -> DONE` 또는 `BLOCKED`)
  3. 다음 `OPEN` 항목을 자동 선택해 `CODE_ORDER.md`를 자동 갱신
  4. `검토해줘` 수동 트리거 없이 저장만으로 루프 진행
- 산출물: `ai_talk/scripts/auto-orchestrator.mjs` + 실행 스크립트 + 룰 문서 업데이트

## 현재 자동화 상태 (중요)
- `pnpm run ai:review-once`: 정상 동작
- `pnpm run ai:orchestrator`: 포그라운드 완전자동 루프 정상 동작
- `pnpm run ai:watch-jaemin`: 오케스트레이터 래퍼(동일 동작)
- `pnpm run ai:auto-start`(nohup 백그라운드): 이 환경에서 프로세스가 자주 종료됨(상주 불안정)
- 자동 승격/판정: `CODE_ALL_ORDER.md` (`DOING -> DONE/BLOCKED`, 다음 `OPEN -> DOING`) + `CODE_ORDER.md` 자동 갱신
- 권장 운영: 로컬 상주가 필요하면 `pnpm run ai:launchd:install` 사용
- 주의: `launchd`도 설치 후 반드시 `pnpm run ai:launchd:status`로 실제 상주 여부 확인. 실패 시 포그라운드(`pnpm run ai:orchestrator`)로 운영.

## 검증 기본 게이트
- `pnpm test` PASS
- `pnpm build` SUCCESS
- 문서 상태와 코드 상태 일치

## 주의
- 재민이 완료 주장해도 DoD/테스트/문서 불일치면 미완료로 판정
- 오더 우선순위는 AI만 변경
- 문서 모순(수치/체크상태) 발견 시 즉시 수정 오더 발행

## 상세 변경 기록 (2026-03-01)

### 1) 자동화 구조 변경
- 신규: `ai_talk/scripts/auto-orchestrator.mjs`
  - `CODE_TRIGGER.md` mtime 감시
  - 변경 감지 시 `review-once` 실행
  - 리뷰 결과는 `REVIEW_RESULT.md`에만 기록
  - 결과에 따라 `CODE_ALL_ORDER.md` 상태 자동 전환
    - `DOING -> DONE` (PASS)
    - `DOING -> BLOCKED` (FAIL)
    - 이후 첫 `OPEN -> DOING` 자동 승격
  - `CODE_ORDER.md` 현재 오더 자동 재작성
- 변경: `ai_talk/scripts/watch-jaemin.mjs`
  - 기존 단순 감시기에서 오케스트레이터 래퍼로 변경
- 변경: `ai_talk/scripts/start-auto-watch.sh`
  - `watch-jaemin.mjs` 대신 `auto-orchestrator.mjs` 직접 실행
- 변경: `ai_talk/scripts/status-auto-watch.sh`
  - 로그 mtime 출력 추가

### 2) 재민 오더 전달 자동화 보강
- 신규 출력 파일: `ai_talk/JAEMIN_TASKS.md`
  - `current_order`를 `CODE_ORDER.md`에서 파싱해 기록
  - `reason` 필드로 갱신 원인 기록 (`orchestrator-start`, `order-updated`, `review-loop-finished`)
- 오케스트레이터가 `CODE_ORDER.md` 변경도 감시
  - 오더 변경 시 `JAEMIN_TASKS.md` 자동 갱신
  - 로그: `[auto-orchestrator] order updated -> ...`

### 3) 실행 커맨드 추가
- `package.json`
  - `ai:orchestrator`
  - `ai:launchd:install`
  - `ai:launchd:status`
  - `ai:launchd:uninstall`
- 신규 스크립트
  - `ai_talk/scripts/install-launchd.sh`
  - `ai_talk/scripts/status-launchd.sh`
  - `ai_talk/scripts/uninstall-launchd.sh`

### 4) 검증 로그 (실행 결과)
- `pnpm test`: 107 PASS
- `pnpm build`: SUCCESS
- 포그라운드 검증:
  1. `node ai_talk/scripts/auto-orchestrator.mjs` 실행
  2. `CODE_TRIGGER.md` 저장
  3. `REVIEW_RESULT.md`, `CODE_ALL_ORDER.md`, `CODE_ORDER.md` 갱신 확인
  4. `CODE_ORDER.md` 수동 변경
  5. `JAEMIN_TASKS.md` 자동 갱신 확인

### 5) 현재 한계/리스크 (중요)
- 일부 실행 환경에서 `ai:auto-start`(`nohup`) 백그라운드 프로세스가 조기 종료될 수 있음
- 대응:
  1. 우선 `launchd` 상주(`ai:launchd:install`)
  2. 설치 후 반드시 `ai:launchd:status`로 실제 상주 확인
  3. 실패 시 포그라운드 `ai:orchestrator` 운영

### 6) 운영 표준 절차 (권장)
1. 오더 발행: `CODE_ORDER.md` 갱신
2. 재민 확인: `JAEMIN_TASKS.md` 기준으로 수행
3. 완료 보고: `CODE_TRIGGER.md` 업데이트 후 저장(저장이 트리거)
4. 자동 검토: `REVIEW_RESULT.md` 확인
5. 오더 상태 확인: `CODE_ALL_ORDER.md`, `CODE_ORDER.md`
