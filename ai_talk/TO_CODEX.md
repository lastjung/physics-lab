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
- 파일 분리: 오더(`CODE_ORDER.md`) / 트리거(`CODE_TRIGGER.md`)

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
- `pnpm run ai:watch-jaemin`: 포그라운드 감시 정상 동작
- `pnpm run ai:auto-start`(nohup 백그라운드): 이 환경에서 프로세스가 유지되지 않는 문제가 있음
- 임시 운영 권장: 별도 터미널에서 `pnpm run ai:watch-jaemin` 상시 실행
- 다음 작업: macOS `launchd` 기반 상주 실행 또는 대체 데몬 방식으로 완전자동화

## 검증 기본 게이트
- `pnpm test` PASS
- `pnpm build` SUCCESS
- 문서 상태와 코드 상태 일치

## 주의
- 재민이 완료 주장해도 DoD/테스트/문서 불일치면 미완료로 판정
- 오더 우선순위는 AI만 변경
- 문서 모순(수치/체크상태) 발견 시 즉시 수정 오더 발행
