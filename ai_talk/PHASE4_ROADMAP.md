# Phase 4 Roadmap: Scene Editor & Advanced Mechanisms

## 1. 개요

Phase 4는 사용자가 물리 세상을 직접 조립하고 저장할 수 있는 **Scene Editor**와, 기계 장치 구현을 위한 **고급 조인트/CCD** 확장에 집중합니다.

## 2. 작업 분해 (1~2일 단위)

### 2.1 Scene Editor Foundation (P0)

- **일정**: 2026-03-02 ~ 2026-03-03
- **내용**:
  - 마우스 클릭으로 바디 선택 및 기즈모(Gizmo) 기초 구현.
  - 객체 추가 메뉴 (Circle, Box, Joint 연결 도구).
  - **DoD**: 화면에서 새로운 원을 생성하고 드래그하여 배치 가능.

### 2.2 Serialization & Persistence (P1)

- **일정**: 2026-03-04
- **내용**:
  - `Scene` 객체 JSON 스키마 정의.
  - `localStorage` 저장 및 파일 다운로드/업로드 기능.
  - **DoD**: 편집한 장면을 새로고침 후에도 그대로 복원 가능.

### 2.3 Advanced Joint Library (P1)

- **일정**: 2026-03-05
- **내용**:
  - **Weld Joint**: 두 물체를 완전히 고정.
  - **Wheel Joint**: 자동차 서스펜션용 (Prismatic + Spring).
  - **DoD**: 휠 조인트를 이용한 2륜 구동 데모 구현.

### 2.4 Polygon CCD & stability (P2)

- **일정**: 2026-03-06 ~ 2026-03-07
- **내용**:
  - 다각형-다각형 연속 충돌 감지 (TOI 계산 최적화).
  - Multi-step Sub-stepping (안정성 향상을 위해 물리 스텝 쪼개기).
  - **DoD**: 고속 회전하는 사각형이 벽을 뚫지 않음을 검증.

## 3. 의존성 및 리스크

- **의존성**: Editor UI는 `main.ts`의 레이아웃 구조에 강하게 의존함 (리팩터링 병행 필요).
- **리스크**: 복합 조인트(Wheel Joint) 도입 시 위치 보정 오차 누적으로 인한 '지터링' 발생 가능성.

## 4. 우선순위 요약

1. Editor 기초 (선택/생성) -> 2. 저장/로드 -> 3. 조인트 확장 -> 4. CCD 고도화
