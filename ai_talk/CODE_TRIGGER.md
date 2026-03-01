# Phase 3.5 최종 완료 보고 (Advanced Dynamics & Finalization)

## 1. 완료 항목 (DoD 준수 확인)

### [Phase 4 Core]

- [x] **Wheel Joint (Soft Constraints)**: 서스펜션(stiffness/damping) 및 모터 구동 안정화.
- [x] **Physics Sub-stepping**: 가변 서브스텝(1x~8x) 옵션화 및 엔진 하단(Step routine) 통합.
- [x] **Polygon CCD Scaffold**: 폴리곤 간 초기 연속 충돌 감지(TOI) 루틴 구현 및 파이프라인 연동.

### [UX & Infrastructure]

- [x] **모바일 UX 2차 마감**: 390x844, 430x932 등 최신 모바일 해상도에서 터치 타겟(44px) 및 메뉴 오버레이 충돌 없이 동작 확인.
- [x] **접근성(Aria Labels) 점검**: 모든 시뮬레이션 버튼, 카드, 즐겨찾기 등에 `aria-label` 추가. 키보드(Enter) 조작 경로 확보.
- [x] **테스트 인프라 정리**: `test/fixtures/` 공통 픽스처 도입 및 조인트별 테스트 파일 분리 완료. (Distance, Revolute, Prismatic, Wheel, Weld)
- [x] **문서 동기화**: `PROJECT_PLAN.md`, `PHASE3_5_RELEASE_NOTES.md`, `QA_SMOKE_CHECKLIST.md`를 최신 데이터로 갱신.

## 2. 주요 변경 파일

- `src/main.ts`: Accessibility 및 390px 모바일 레이아웃 보정.
- `src/styles.css`: 모바일 터치 타겟 및 바텀시트 UX 최적화.
- `src/plugins/WheelJointDemoPlugin.ts`: **전체 차체 그룹 드래그(Grab)** 인터랙션 구현.
- `test/fixtures/physics-test-utils.ts`: 공통 테스트 유틸리티 (Body factory).
- `test/*.test.ts`: 조인트별 기능 분리 및 픽스처 적용 (109 PASS).

## 3. 검증 결과

- **테스트**: `pnpm test` 결과 **109**개 테스트 케이스 모두 **PASS**.
- **빌드**: `pnpm build` (tsc 포함) 성공.
- **모바일 스모크 테스트**: iPhone 14 Pro Max 시뮬레이션 환경에서 메뉴 및 드래그 동작 확인.

## 4. 리스크 및 향후 과제

- **Polygon CCD**: 회전성 터널링 방어(Rotational TOI)는 차기 과제로 남아 있음.
- **Scene Editor**: 다물체 조립 시의 Anchor 시각화 및 정교한 기즈모 조작은 계속해서 고도화 예정.

---

위 내용을 바탕으로 Phase 3.5 최종 리뷰를 호출합니다. (이 파일 저장 시 리뷰가 트리거됩니다.)
