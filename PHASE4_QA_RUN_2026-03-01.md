# Phase 4 QA Run Log (2026-03-01)

## 범위

- Scene Editor 입력 검증/보정
- Joint 생성 프리뷰/앵커 가시화
- 다중 선택 및 그룹 이동
- 스냅 고도화(Grid/Anchor/Angle)
- 회귀 테스트 및 빌드 게이트

## 자동 검증 결과

- `npm run build`: PASS
- `npm test`: PASS (101 tests)
- 핵심 확장 테스트:
  - `test/engine2d-joints.test.ts` long-run stress 2건 PASS
  - `test/scene-editor.test.ts` serialize version/legacy 2건 PASS

## 수동 점검 체크

- [x] Joint 모드 진입 시 프리뷰 라인/앵커가 캔버스에 표시됨
- [x] Prismatic 생성 시 포인터 방향 기준 축 생성 (Angle Snap 옵션 반영)
- [x] Shift+Click 다중 선택 후 그룹 드래그 이동
- [x] 빈 공간 드래그 박스 선택(Drag-select) 동작
- [x] `Esc` 키로 선택/모드 초기화 동작
- [x] Motor/Limit 입력값의 비정상 범위 자동 보정
  - `maxMotorTorque/maxMotorForce >= 0`
  - `lower > upper` 입력 시 자동 swap
- [x] Import JSON 포맷 검증 실패 시 메시지 출력
- [x] Debounce autosave 적용 (연속 편집 시 저장 빈도 제어)
- [ ] 모바일 터치 제스처 점검 (별도 디바이스 확인 필요)

## 이슈 리스트

- 오픈 이슈 없음 (이번 라운드 자동 검증 기준)
- 수동 모바일 QA는 다음 라운드에서 확정 필요
