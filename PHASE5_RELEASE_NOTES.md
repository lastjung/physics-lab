# Phase 5 Release Notes - Physics Lab

## 릴리스 요약

Phase 5에서는 myPhysicsLab의 주요 엔진 시뮬레이션 5종을 성공적으로 구현하고 통합하였습니다. 이번 단계의 핵심은 **곡선 충돌(Approximated Curved Surface)**, **강체 롤러코스터**, **입자-제약 기반 줄(String)** 모델, 그리고 **복잡한 기계 장치(시계 탈진기)**의 기초 구현입니다.

## 주요 변경 사항

### 1. 신규 시뮬레이션 모델 (5종)

- **Curved Objects**: Polyline을 이용해 곡면을 근사하고, 원형 오브젝트와 정밀한 충돌 및 리바운드를 구현했습니다.
- **Rigid Roller Coaster**: 이전의 점질량 볼 모델과 달리, 크기와 회전 관성을 가진 강체 카트가 트랙을 주행합니다.
- **String Simulation**: 수십 개의 질점과 Distance Joint(Stable Soft Constraint)를 결합하여 물리적으로 안정적인 줄의 거동을 모사했습니다.
- **Pendulum Clock (Escapement)**: 톱니바퀴(Gear)와 팰릿(Latch)이 맞물려 에너지를 전달하고 주기를 제어하는 탈진기 메커니즘을 구현했습니다.
- **Rigid Double Pendulum**: 바(Bar) 형태의 강체를 Revolute Joint로 연결하여, 점질량 모델과는 다른 물리적 특성과 카오스 거동을 보여줍니다.

### 2. 엔진 고도화

- **Distance Joint Soft Constraint**: `frequency`와 `dampingRatio` 기반의 안정적인 스프라이-댐퍼 제약 조건을 추가했습니다.
- **Engine2D Canvas Renderer**: 다양한 엔진 기반 시뮬레이션을 공통으로 렌더링할 수 있는 범용 렌더러를 도입했습니다.
- **Generic Engine Plugin**: 마우스 드래그 인터랙션이 포함된 공통 플러그인 로직을 통해 구현 속도와 일관성을 높였습니다.

### 3. UI 및 사용성 개선

- **Top Library Sorting**: 신규 추가된 시뮬레이션을 라이브러리 상단/좌측에 우선 배치하여 접근성을 높였습니다.
- **Engine Divider**: 엔진 기반 시뮬레이션들을 별도의 섹션으로 구분하여 시각화했습니다.

## 테스트 및 안정성 결과

- **회귀 테스트**: 전체 자동 테스트 케이스가 **109에서 114로 확장**되었으며, 전건 PASS를 유지하고 있습니다.
- **NaN 방지**: 장시간(100+ steps) 실행 시에도 수치적 발산(NaN)이 발생하지 않음을 검증했습니다.
- **빌드 상태**: Vite 빌드 및 타입 체크가 정상적으로 완료되었습니다.

## 남은 과제

- **Dangling Stick**: 아직 미구현 상태이며, 다음 단계에서 추가될 예정입니다.
- **CCD (Continuous Collision Detection)**: 현재 Scaffold 단계인 CCD 로직을 고속 이동체에 대해 더 정밀하게 고도화할 필요가 있습니다.
- **UX 폴리싱**: 각 데모별로 특화된 파라미터 조절 UI를 더 직관적으로 개선할 예정입니다.
