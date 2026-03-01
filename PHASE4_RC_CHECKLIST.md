# Phase 4 Release Candidate Checklist

## 1) 필수 게이트

- [ ] `npm run build` PASS
- [ ] `npm test` PASS (현재 기준 101 tests)
- [ ] Scene Editor import/export round-trip 수동 확인
- [ ] Joint 생성/편집(모터/리밋) 수동 확인
- [ ] Drag-select / Shift multi-select / Esc clear 수동 확인
- [ ] Regression 로그와 계획 문서 수치 동기화

## 2) 권장 게이트

- [ ] 모바일 터치 조작 QA(실기기) 완료
- [ ] 대규모 scene(바디/조인트 증가)에서 입력 지연 체감 없음 확인
- [ ] Scene 포맷 구버전(v1/v2) 파일 로드 샘플 점검

## 3) 중단 조건 (Blockers)

- [ ] NaN/Infinity 상태 발생
- [ ] import 실패 시 에러 메시지 미표시
- [ ] joint limit 역전/모터 max 값 음수 입력 시 보정 실패
- [ ] 장시간 stress 테스트에서 제약 이탈 급증

## 4) 완료 기록

- RC 버전:
- 확인 일시:
- 확인자:
- 비고:
