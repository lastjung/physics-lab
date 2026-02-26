# Google Lyria (MusicFX) 음악 제조 및 다운로드 가이드

이 문서는 `physics-lab` 프로젝트에서 구글의 Lyria AI(MusicFX)를 사용하여 고품질 피아노 음원을 생성하고 프로젝트에 통합하는 표준 절차를 설명합니다.

## 1. 음악 생성 (MusicFX)

- **도구:** [Google MusicFX](https://labs.google/fx/tools/music-fx)
- **설정:**
  - **Length (길이):** 가능하면 70s로 설정 (계정에 따라 30s만 가능할 수 있음)
  - **Instrument:** 주로 Grand Piano 사용
- **프롬프트 예시:**
  - `Logic Pulse: Analytical and precise grand piano melody, steady tempo, crystal clear tone`
  - `Gravity Wave: Ethereal and dreamy grand piano with deep reverb, floating melody`
  - `Singularity: Dark, intense and deep piano melody, minor key, mysterious atmosphere`

## 2. 다운로드 및 명명 규칙 (Naming Convention)

생성된 음원은 다음 규칙에 따라 이름을 변경하여 구분하기 쉽게 관리합니다.

- **형식:** `NNN_테마이름_무드.wav`
- **파일명 예시:**
  - `001_Lyria_Piano_Ethereal_70s.wav`
  - `002_Logic_Pulse_Analytical.wav`
  - `003_Gravity_Wave_Ethereal.wav`

## 3. 프로젝트 통합 경로

변경 완료된 파일은 아래의 경로로 이동시킵니다.

- **저장 위치:** `public/audio/piano-lyria/`
- **코드 반영:** `src/core/audio/audioEngine.ts` 파일의 `PIANO_LYRIA` 배열에 새 파일 경로 추가

## 4. 작업 팁

1. **일괄 생성:** MusicFX 히스토리를 활용하여 여러 분위기를 한꺼번에 생성한 뒤 다운로드하면 효율적입니다.
2. **이름 식별:** `001_` 과 같은 숫자 접두사를 붙여야 폴더 내에서 정렬이 쉽고 코드에서 관리하기 용이합니다.
3. **WAV 포맷:** 고품질 유지를 위해 가급적 WAV 포맷 그대로 사용합니다.

---

_마지막 업데이트: 2026-02-26_
