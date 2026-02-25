# Physics Lab 프로젝트 개요 및 개발 계획

## 0. 개발 원칙 (중요)

이 문서의 구조/순서는 **현재 기준 제안안**이며, 고정 규칙이 아니다.
다음 원칙을 항상 우선한다.

1. 더 좋은 방법이 있으면 즉시 채택
- 기존 방식에 얽매이지 않고, 성능/유지보수/개발속도 측면에서 더 나은 접근을 우선한다.

2. 더 쉽고 안정적인 라이브러리가 있으면 교체 가능
- 구현 복잡도를 낮추고 팀 생산성을 높일 수 있으면 라이브러리 변경을 허용한다.
- 단, 변경 시 근거(장점/리스크/마이그레이션 비용)를 간단히 기록한다.

3. 현대적 UX/아키텍처로 지속 개선
- 모바일 우선 UX, 접근성, 성능, 상태관리, 플러그인 구조를 지속적으로 개선한다.
- “동작만 하는 것”보다 “확장 가능한 품질”을 목표로 한다.

4. 단계 계획은 실험 결과에 따라 조정
- 로드맵은 진행 중 변경 가능하며, 검증 결과가 좋으면 우선순위를 재배치한다.

## 1. 프로젝트 소개

Physics Lab은 물리 시뮬레이션(현재: 진자, 스프링-질량)을 웹에서 실시간으로 실행하고,
파라미터를 조절하며 동작을 관찰할 수 있는 확장형 실험 앱입니다.

현재는 `GamePlugin` 구조를 도입하여, 공통 메뉴(재생/정지/스텝/리셋)와
게임별 메뉴(각 시뮬레이션 전용 파라미터)를 분리한 상태입니다.

## 2. 참고한 사이트

1. MyPhysicsLab 공식 웹사이트
- https://www.myphysicslab.com/

2. MyPhysicsLab GitHub 저장소
- https://github.com/myphysicslab/myphysicslab

3. (참고 파일 예시) ImpulseApp
- https://github.com/myphysicslab/myphysicslab/blob/master/src/sims/engine2D/ImpulseApp.ts

## 3. 코드 참고용 Git 경로 (Source 중심)

1. MyPhysicsLab `src` 루트
- https://github.com/myphysicslab/myphysicslab/tree/master/src

2. Engine2D 시뮬레이션 코드
- https://github.com/myphysicslab/myphysicslab/tree/master/src/sims/engine2D

3. Common/Framework 코드
- https://github.com/myphysicslab/myphysicslab/tree/master/src/lab

## 4. 현재 개발 상태 (첨부 이미지 기준)

1. 상단 게임 선택 UI 구현
- `Damped Pendulum`
- `Ideal Pendulum`
- `Spring Mass`

2. 공통 제어 기능 구현
- Play/Pause
- Reset
- Step / Step x12
- 키보드 단축키(Space, R, ., Shift+.)

3. 게임별 인터랙션 구현
- Pendulum: 공 드래그로 각도 설정
- Spring Mass: 블록 드래그로 변위 설정

4. URL 상태 공유 구현
- `?sim=...` 및 파라미터 상태를 URL에 반영

## 5. 추가 개발 계획 (우선순위 순)

아래 순서는 myPhysicsLab 공개 시뮬레이션 군(스프링/진자/충돌/롤러코스터/분자 등)을 기준으로 잡은 제안안이며,
실제 구현 과정에서 변경될 수 있다.

### 5.1 myPhysicsLab 게임군 기준 단계별 개발 순서

1. 기초 ODE 계열 확장 (스프링/진자)
- Single Spring 고도화
- Double Spring
- 2D Spring / Double 2D Spring
- Double Pendulum / Moveable Pendulum 계열

2. 조합 시스템 (Coupled System)
- Cart + Pendulum
- Dangling Stick
- Car Suspension
- Pendulum Clock

3. Engine2D 입문 (충돌/접촉 기초)
- Colliding Blocks
- Newton's Cradle
- Billiards
- Rigid Body Collisions / Contact Forces

4. 트랙/경로 시스템
- Roller Coaster
- Roller Coaster with Spring / Two Balls / Flight
- Brachistochrone
- Rigid Body Roller Coaster

5. 다물체/제약/체인
- Hanging Chain
- String
- Pile / Pile Attract
- Curved Objects

6. 고급 비교/검증 시뮬레이션
- Compare Double Pendulums
- Rigid Double Pendulum
- Double Pendulum with Physics Engine

7. 확장 주제 (선택)
- Molecule 2~6
- Mutual Attraction
- Mars Moon

### 5.2 우리 프로젝트 적용 순서 (실행 플랜)

1. 오디오 시스템 도입 (공통)
- Master / SFX / BGM 분리
- 개별 볼륨 및 mute
- 설정 localStorage 저장

2. 모바일 UX 고도화
- 바텀시트 메뉴
- 터치 타겟 확대
- 저사양 렌더 옵션

3. 게임 라이브러리 확장
- 카드형 선택 UI
- 카테고리(역학/파동/전기 등)
- 즐겨찾기/최근 실행

4. 시뮬레이션 추가
- 이중 진자
- 감쇠/강제 진동 스프링
- 충돌(impulse) 기반 데모

5. 품질 강화
- 수치 회귀 테스트(에너지/주기)
- UI 접근성 점검(Web guidelines)
- 플러그인 lifecycle 확장(onResize/onPause/onResume)

## 6. 필요한 개발 환경 / 소프트웨어

1. 필수
- Node.js 20+
- pnpm 10+
- Git

2. 권장
- VS Code
- Chrome DevTools
- Lighthouse(성능/접근성 점검)

3. 실행 명령
- 설치: `pnpm install`
- 개발: `pnpm run dev`
- 빌드: `pnpm run build`
- 미리보기: `pnpm run preview`

## 7. 문서 목적

이 문서는 현재 구현 범위와 앞으로의 개발 순서를 팀/협업 관점에서 빠르게 공유하기 위한 기준 문서입니다.
