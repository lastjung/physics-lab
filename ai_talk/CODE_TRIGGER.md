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

#### 완료 항목 (Cycle-3 & Cycle-4)

1. **문서 수치 정합성 완결**: 전역적으로 **92 PASS** 수치 동기화 및 과거 기록 맥락 정리.
2. **Scene Editor 인터랙션 구현 (Cycle-4 #1)**:
   - Circle/Box 생성 버튼 기능.
   - 클릭 기반 물체 선택 및 하이라이팅 효과.
   - 선택된 물체의 자유로운 드래그 이동.
3. **Weld Joint 구현 (Cycle-4 #6)**:
   - 두 물체를 강체처럼 고정하는 Weld Joint 솔버 구현 (선형+각도 3개 축 구속).
   - Scene Editor UI에 'Weld' 버튼 추가 및 녹색 시각화 적용.
   - `test/weld-joint.test.ts` 회귀 테스트 2개 추가 및 94건 전체 통과 확인.
4. **시스템 견고성**: SceneEditorSimulation에 독립적인 `step` 메서드 추가로 테스트 및 시뮬레이션 제어력 강화.

#### 변경 파일

- `src/engine2d/joints/types.ts` (WeldJoint 타입 추가)
- `src/engine2d/joints/solveWeldJoint.ts` (Weld 솔버 신규 구현)
- `src/engine2d/collision/pipeline.ts` (솔버 통합)
- `src/simulations/sceneEditor.ts` (Weld 생성 로직 및 step 메서드 추가)
- `src/render/sceneEditorCanvasRenderer.ts` (Weld 시각화)
- `src/plugins/SceneEditorPlugin.ts` (Weld UI 및 인터랙션)
- `test/weld-joint.test.ts` (회귀 테스트)
- `ai_talk/CODE_TRIGGER.md`, `ai_talk/CODE_ORDER.md` 등 (상태 최신화)

#### 검증 결과

- `pnpm test`: **94 PASS** (Weld Joint 테스트 포함 전체 통과)
- `pnpm build`: **SUCCESS** (Vite build 완료)
- **수동 확인**: Weld 버튼으로 두 박스를 연결했을 때, 한쪽을 드래그하거나 회전시켜도 상대적 위치/각도가 유지되는 것을 확인.

#### 남은 이슈 / 리스크

- 현재 Cycle-4의 항목 5(Wheel Joint) 또는 항목 7(Polygon CCD) 작업을 검토할 예정입니다.

저장 확인: 2026-03-01 06:55

#### 다음 제안 1~2개

1. **Phase 4: Scene Editor 기초**: 캔버스 내 물체 선택 시스템 및 이동 기즈모(Gizmo) UI 구현 시작.
2. **Joint Type 확장**: Weld Joint(완성) 또는 Gear Joint와 같은 복합 조인트 타입 검토.

---

## 검토 프로토콜

재민이 이 문서를 직접 수정/저장하면, Codex가 이 파일과 실제 코드 변경을 기준으로 즉시 리뷰합니다.
