# TO_CODEX (필독)

## 목적
이 프로젝트의 AI-재민 협업 루프를 다음 Codex 인스턴스가 즉시 이어받기 위한 인수인계 문서.

## 반드시 읽을 파일 순서
1. `ai_talk/AI_COLLAB_RULES.md`
2. `ai_talk/jaemin-review-loop/SKILL.md`
3. `ai_talk/AI_ORDERS_NOW.md`
4. `ai_talk/JAEMIN_TASKS.md`

## 운영 원칙
- 감독/우선순위 결정: AI
- 실행/구현: 재민
- 단일 오더 원본: `ai_talk/AI_ORDERS_NOW.md`
- 재민 신호 문구: `검토해줘`

## Codex 작업 절차
1. `AI_ORDERS_NOW.md`의 현재 사이클과 OPEN/DOING/BLOCKED/DONE 상태 확인
2. 재민이 `검토해줘` 요청 시 코드/문서/테스트 검증 수행
3. 결과를 `Findings -> Orders -> Verify -> Report` 포맷으로 회신
4. 검증 결과를 반영해 `AI_ORDERS_NOW.md` 상태 및 다음 오더 갱신

## 검증 기본 게이트
- `pnpm test` PASS
- `pnpm build` SUCCESS
- 문서 상태와 코드 상태 일치

## 주의
- 재민이 완료 주장해도 DoD/테스트/문서 불일치면 미완료로 판정
- 오더 우선순위는 AI만 변경
- 문서 모순(수치/체크상태) 발견 시 즉시 수정 오더 발행
