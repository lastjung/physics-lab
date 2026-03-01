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

1. [진행중] 기초 ODE 계열 확장 (스프링/진자)

- [진행중] Single Spring 고도화
- [완료] Driven Spring 성격 확장(강제 진동/감쇠 제어: Driven Pendulum 및 스프링군 파라미터 확장)
- [미착수] Double Spring
- [미착수] 2D Spring / Double 2D Spring
- [완료] Double Pendulum / Moveable Pendulum 계열 (Double Pendulum)
- [완료] Coupled Spring(2질량 결합/에너지 교환) 구현

2. [진행중] 조합 시스템 (Coupled System)

- [완료] Cart + Pendulum
- [완료] 카트/추 개별 드래그 인터랙션 + 구동 외력(Drive Amp/Freq) 제어
- [미착수] Dangling Stick
- [완료] Car Suspension
- [완료] Car Suspension 그랩(손잡이) 위치 조절(Grip X/Y) + 저장/복원 연동
- [미착수] Pendulum Clock

3. [진행중] Engine2D 입문 (충돌/접촉 기초)

- [완료] Colliding Blocks (2026-03-01)
- [완료] Newton's Cradle
- [완료] Newton's Cradle 충돌음(5음계) + 추천 기본값/충돌 간격 보정
- [완료] Billiards
- [완료] Rigid Body Collisions / Contact Forces (Collision Lab 기반)
- [완료] Collision Lab 질량/반발/감쇠/초기속도 조절 + 보드 확장

4. [진행중] 트랙/경로 시스템

- [완료] Roller Coaster
- [완료] Roller Coaster 트랙 프리셋 3종(Balanced/Steep/Long Wave)
- [완료] Roller Coaster 길 선택 옵션(Short/Medium/Long)
- [완료] 경계 모드(Bounce/Wrap) + 바닥 정지 탈출/과속 완화
- [완료] Roller Coaster with Two Balls(2볼 충돌/드래그/트랙 공유)
- [완료] Roller Coaster with Spring (2026-03-01)
- [완료] Roller Coaster with Flight (2026-03-01)
- [미착수] Brachistochrone
- [미착수] Rigid Body Roller Coaster

5. [완료] 다물체/제약/체인

- [완료] Hanging Chain
- [미착수] String
- [완료] Pile / Pile Attract
- [미착수] Curved Objects

6. [완료] 고급 비교/검증 시뮬레이션

- [완료] Compare Double Pendulums
- [미착수] Rigid Double Pendulum
- [완료] Double Pendulum with Physics Engine (2026-03-01)

7. [미착수] 확장 주제 (선택)

- [미착수] Molecule 2~6
- [미착수] Mutual Attraction
- [미착수] Mars Moon

### 5.2 우리 프로젝트 적용 순서 (실행 플랜)

상태 표기:

- `[완료]`: 현재 코드에 반영되어 동작 확인됨
- `[진행중]`: 일부 반영됨 (추가 작업 필요)
- `[미착수]`: 아직 시작 전

1. [완료] 오디오 시스템 도입 (공통)

- Master / SFX / BGM 분리
- 개별 볼륨 및 mute
- 설정 localStorage 저장
- 충돌/드래그/리셋 SFX 및 피아노 5음 기반 충돌음 적용
- 게임별 SFX 프로필 분리(기본/진자/충돌/크래들/코스터)
- 오디오 잠금 상태 표시(Ready / Locked) 및 첫 입력 unlock/자동 복구
- [완료] Play only 오디오 옵션(Play 상태에서만 소리 출력 토글)

2. [진행중] 모바일 UX 고도화

- 바텀시트 메뉴
- 터치 타겟 확대
- 저사양 렌더 옵션

3. [완료] 게임 라이브러리 확장

- 카드형 선택 UI
- 카테고리(역학/파동/전기 등)
- 즐겨찾기/최근 실행

4. [완료] 시뮬레이션 추가

- 이중 진자
- 감쇠/강제 진동 스프링
- 충돌(impulse) 기반 데모
- Collision Lab 초기속도/감쇠/반발계수 조절 및 기본값 저장
- Collision Lab 보드 크기 확장 반영 완료
- Newton's Cradle 추가(무지개 공, 추천 기본 세팅 저장)
- Cart + Pendulum 추가(카트/추 드래그 인터랙션)
- Roller Coaster 추가(트랙 프리셋 3종, 경계 모드 Bounce/Wrap)
- Roller Coaster Two Balls 추가(2개 공 충돌/길 선택 옵션)
- Roller Coaster 정지 탈출 보정 및 과속 완화
- Billiards 추가(6볼 충돌/드래그/큐 속도 제어)
- Car Suspension 추가(쿼터카 2질량 스프링-댐퍼 + 노면 입력)
- Car Suspension 그랩 위치 슬라이더(Grip X/Y) 추가 및 preset/state 저장 반영

5. [진행중] 품질 강화

- [진행중] 수치 회귀 테스트(에너지/주기)
- [완료] 전체 자동 테스트 107 PASS 기준으로 갱신 (2026-03-01)
- [완료] 신규 3게임(Newton/Cart+Pendulum/Roller) 스모크 테스트 추가
- [완료] Billiards/Car Suspension 회귀 테스트 추가
- [미착수] UI 접근성 점검(Web guidelines)
- [완료] 플러그인 lifecycle 확장(onResize/onPause/onResume)
- [완료] 캔버스 좌상단 HUD 통계 오버레이 추가

6. [진행중] Phase 4: Advanced Mechanisms

- [완료] Joint Motor: revolute/slider 구동 및 제어 (2026-03-01 완료)
- [완료] Joint Limits: 각도/이동 범위 제한 및 충격 처리 (2026-03-01 완료)
- [완료] Prismatic Joint: 직선 조립 구조 및 안정성 검증 완료
- [진행중] Scene Editor: 바디/조인트 생성 scaffold 및 기초 기즈모 설계 중
- [완료] Scene Editor 환경 파라미터(중력) UI + 직렬화/복원 반영 (2026-03-01)
- [완료] Revolute Demo 드래그 기반 Arm Length 동기화 + Arm Length/Gravity 슬라이더 반영 (2026-03-01)

### 5.3 다음 2주 실행 계획 (우선순위)

1. Scene Editor 조작 완성도 향상

- 선택/다중선택/삭제/복제 단축키 정리
- Transform Gizmo(이동/회전) 안정화 및 스냅 옵션 추가

2. Joint 편집 UX 고도화

- Revolute/Prismatic 생성 시 실시간 프리뷰 및 anchor 시각화
- 조인트 선택 시 속성 패널(모터/리밋/강성) 즉시 편집 지원

3. 안정성 검증 강화

- Joint stress 테스트(장시간 step, high-torque/high-speed 케이스) 추가
- Scene serialize/deserialize 회귀 테스트 확장(환경 파라미터 포함)

4. 성능 및 문서 마무리

- Scene Editor 렌더 경량화(선택 하이라이트/그리드 최소 redraw)
- Phase 4 중간 릴리스 노트 + QA 체크리스트 갱신

### 5.4 실행 현황 업데이트 (2026-03-01)

- [진행중] Scene Editor 조인트 편집 패널 고도화 (Revolute/Prismatic 모터/리밋/입력보정 반영)
- [완료] Scene 저장 포맷 버전 관리 도입 (`version: 3`, v1/v2 legacy 포맷 역호환 유지)
- [완료] Joint 장시간 스트레스 회귀 테스트 추가 (Revolute/Prismatic long-run finite/bounded 검증)
- [진행중] Scene Editor 조작 완성도 개선 (Shift 다중선택/그룹 드래그 + Drag-select + Grid/Anchor/Angle Snap 반영)
- [완료] Scene Editor Esc 선택해제/모드 초기화 반영
- [완료] Scene Editor Import JSON 포맷 검증 및 사용자 메시지 반영
- [완료] localStorage autosave debounce + RAF redraw 스케줄링 + hit-test cache 1차 반영
- [완료] Phase 4 중간 릴리스 기준선 문서화 (`PHASE4_BASELINE.md`)
- [완료] Phase 4 QA 라운드 1차 실행 로그 기록 (`PHASE4_QA_RUN_2026-03-01.md`)
- [완료] Phase 4 RC 체크리스트 초안 작성 (`PHASE4_RC_CHECKLIST.md`)

### 5.5 myPhysicsLab 비교 기반 게임 추가 구현 항목 (2026-03-01 갱신)

비교 기준:
- myPhysicsLab 메인 시뮬레이션 목록(https://www.myphysicslab.com/)
- 개발용 앱 인덱스(https://www.myphysicslab.com/develop/build/index-en.html)

현재 우리 프로젝트 대비 게임 중심 미구현/부분구현 항목:

1. [완료] Roller Coaster with Spring
2. [완료] Roller Coaster with Flight
3. [미착수] Rigid Body Roller Coaster
4. [완료] Colliding Blocks
5. [완료] Polygon Shapes (2026-03-01)
6. [미착수] Curved Objects
7. [미착수] String
8. [미착수] Pendulum Clock
9. [미착수] Dangling Stick
10. [완료] Double Pendulum with Physics Engine
11. [완료] Cart + Pendulum with Physics Engine
12. [미착수] Rigid Double Pendulum

우선순위 Top 6 (게임성 + 엔진 확장성 기준):

1. [우선] Rigid Body Roller Coaster
2. [우선] Curved Objects
3. [우선] String
4. [우선] Pendulum Clock
5. [우선] Dangling Stick
6. [우선] Rigid Double Pendulum

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
