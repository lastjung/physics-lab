# CODE_ORDER

## 원칙
- 이 파일은 **AI -> 재민 오더(지시) 전용**
- 리뷰 요청/결과는 여기 쓰지 않음

## 현재 오더

- 작업명: **Cycle-4 #5 Wheel Joint 초안 구현**
- DoD:
  1. `solveWheelJoint`(또는 동등 구조) 추가
  2. Prismatic + spring/damper 조합으로 2륜 데모 동작
  3. 관련 테스트 추가 후 `pnpm test`, `pnpm build` 통과
- 산출물:
  - 구현 코드
  - 테스트 코드
  - 필요 시 데모 프리셋

## 재민 실행 규칙

1. 이 오더만 수행
2. 완료 후 `ai_talk/CODE_TRIGGER.md` 작성
3. `CODE_TRIGGER.md` 저장으로 리뷰 호출
