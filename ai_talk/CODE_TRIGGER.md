# 작업 완료 보고 (Wheel Joint 구현 및 테스트)

## 1. 완료 항목 (DoD 준수 확인)

- [x] **Wheel Joint 초안 구현**: `solveWheelJoint` 구현 및 `WheelJointDemo`에서 서스펜션(prismatic) + 모터(revolute) 동작 확인.
- [x] **Wheel Joint 테스트 추가**: `test/wheel-joint.test.ts`에 정적 수렴(Convergence) 및 고속 입력 안정성(Stability) 테스트 추가 및 통과.
- [x] **Polygon CCD 스캐폴드**: `timeOfImpactPolygonPolygon` (Linear SAT 방식) 구현 및 `pipeline.ts` 연동. 실패 케이스(회전 터널링 등) 문서화 완료.
- [x] **Physics Sub-stepping 옵션화**: Scene Editor 및 Wheel Joint 데모에 1/2/4/8 스텝 옵션 추가. UI에 노출하여 안정성 비교 가능하도록 구성.

## 2. 변경 파일 목록

- `src/engine2d/joints/types.ts`: `WheelJoint` 타입 정의 추가.
- `src/engine2d/joints/solveWheelJoint.ts`: `solveWheelVelocity`, `solveWheelPosition` 구현.
- `src/engine2d/collision/pipeline.ts`: Wheel Joint 및 Polygon CCD 로직 연동.
- `src/engine2d/collision/ccd.ts`: `timeOfImpactPolygonPolygon` 스캐폴드 추가.
- `src/simulations/sceneEditor.ts`: `subSteps` 파라미터 및 로직 추가.
- `src/plugins/SceneEditorPlugin.ts`: Sub-stepping UI 컨트롤 추가.
- `src/simulations/wheelJointDemo.ts`: Wheel Joint 기능 검증을 위한 신규 데모.
- `src/render/wheelJointDemoCanvasRenderer.ts`: Wheel Joint 전용 렌더러.
- `src/ui/wheelJointDemoControls.ts`: Wheel Joint 파라미터 튜닝 UI.
- `src/main.ts`: Wheel Joint 데모 플러그인 등록.
- `test/wheel-joint.test.ts`: 신규 테스트 코드.

## 3. 검증 결과

- **테스트**: `pnpm test` 결과 109개 테스트 케이스 모두 PASS.
- **빌드**: `pnpm build` (tsc 포함) 성공.

## 4. 리스크 및 향후 과제

- **Polygon CCD**: 현재 선형 이동(Linear)만 고려하므로, 고속 회전하는 얇은 폴리곤의 경우 터널링 가능성이 남아 있음. 향후 Conservative Advancement 기법 도입 필요.
- **Wheel Joint**: 서스펜션이 Soft Constraint 방식이므로, Stiffness가 매우 높을 경우 Sub-stepping 없이 진동할 수 있음. (현재 4x 이상 권장)

---

위 내용을 바탕으로 리뷰를 요청합니다. (이 파일 저장 시 리뷰 프로세스가 트리거됩니다.)
