# 재민 작업 지시서 (2026-03-01)

## 목적

Phase 4 진입 전, 조인트/품질/QA 마감 작업을 빠르게 진행합니다.

## 우선순위 작업 리스트

- [x] 1. Prismatic(Slider) Joint 1차 구현
  - 완료 기준: `types.ts`에 조인트 타입 추가, `solvePrismaticJoint.ts`(속도/위치), `pipeline.ts` 연결, 테스트 2개 이상 통과.

- [x] 2. Revolute Motor/Limit 데모 시뮬레이션 1개 추가
  - 완료 기준: UI 슬라이더(`motorSpeed`, `maxTorque`, `lower/upper`) 조작 가능.

- [x] 3. 조인트 회귀 테스트 강화
  - 완료 기준: 조인트 테스트 4개 이상 추가(정지 안정성, 토크 saturation, hard limit, referenceAngle), 전체 `pnpm test` 통과.

- [x] 4. QA 스모크 수동 항목 클리어
  - 기준 문서: `QA_SMOKE_CHECKLIST.md`
  - 완료 기준: 미완료 4항목(모바일/터치/FPS/frame-stutter) 체크 후 상태 업데이트.

- [x] 5. 플러그인 lifecycle 확장(`onResize/onPause/onResume`)
  - 완료 기준: `plugins/types.ts` 확장, 최소 2개 플러그인 적용, pause/resume 시 상태 일관성 확인.

- [x] 6. 모바일 UX 마감 (Cycle-2 완료)
  - 완료 기준: 바텀시트 열기/닫기 안정화, 터치 타겟 확대, 모바일 해상도에서 주요 조작 3개 이상 정상 동작.

- [x] 7. 문서 동기화 (Cycle-2 완료)
  - 완료 기준: `PROJECT_PLAN.md`, `PHASE3_5_RELEASE_NOTES.md`에 구현 상태 반영(최신 테스트 수치 포함).

- [x] 8. Phase 4 킥오프 태스크 분해 (Cycle-2 완료)
  - 완료 기준: `Joint Motor/Limit/Slider/Scene Editor`를 이슈 단위로 분해하고 우선순위/의존성 명시.

---

## 작업 결과 기록 규칙 (재민 작성)

아래 섹션을 문서 맨 아래에 직접 추가/수정해주세요.

#### 완료 항목 (Cycle-3)

1. **문서 수치 동기화**: `QA_SMOKE_CHECKLIST.md`, `PHASE3_5_RELEASE_NOTES.md`, `AI_ORDERS_NOW.md`의 테스트 통과 수치를 **87 PASS**로 일관되게 업데이트하여 문서 간 모순을 완전히 해결함.
2. **Revolute Demo UI 고도화**: 인라인 스타일을 제거하고 공통 CSS 클래스를 적용하여 디자인 시스템 동기화. 각도 제한 값 표시 및 계산 버그(degree vs radian) 수정.
3. **인터랙션 보강**: Revolute Demo에 마우스/터치 드래그 기능을 추가하여 조작성 향상.

#### 변경 파일

- `QA_SMOKE_CHECKLIST.md`, `PHASE3_5_RELEASE_NOTES.md`, `ai_talk/AI_ORDERS_NOW.md` (수치 동기화)
- `src/ui/revoluteDemoControls.ts` (UI 리팩터링 및 버그 수정)
- `src/simulations/registry.ts` (Revolute Preset 각도 단위 수정)
- `src/styles.css` (공통 정렬 스타일 추가)

#### 검증 결과

- `pnpm test`: **87 PASS** (전원 통과)
- `pnpm build`: **SUCCESS** (Vite build 완료)
- **문서 일관성**: 모든 문서에서 테스트 통과 수치가 87로 일치함을 확인.

#### 남은 이슈 / 리스크

- 현재까지 발견된 문서 데이터 불일치는 모두 해소됨.

#### 다음 제안 1~2개

1. **Phase 4: Scene Editor 기초**: 캔버스 내 물체 선택 시스템 및 이동 기즈모(Gizmo) UI 구현 시작.
2. **Joint Type 확장**: Weld Joint(완성) 또는 Gear Joint와 같은 복합 조인트 타입 검토.

---

## 검토 프로토콜

재민이 이 문서를 직접 수정/저장하면, Codex가 이 파일과 실제 코드 변경을 기준으로 즉시 리뷰합니다.
