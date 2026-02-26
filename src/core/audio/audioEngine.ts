export interface AudioSettings {
  master: number;
  sfx: number;
  music: number;
  muteAll: boolean;
  muteSfx: boolean;
  muteMusic: boolean;
}

export type SfxProfileId = 'default' | 'pendulum' | 'collision' | 'cradle' | 'coaster';

const STORAGE_KEY = 'physics-lab-audio-v1';
const SFX_GAIN_BOOST = 4;
const PIANO_SHORTS: string[] = [
  '/audio/piano-shorts/Piano_Short_01_Nocturne_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_02_Moonlight_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_03_Claire_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_04_Liebestraum_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_05_Gymnopedie_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_06_Classical_Sonata_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_07_Rach_Grand_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_08_River_Flows_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_09_Hisaishi_Fantasy_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_10_Jazz_Mood_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_11_Ragtime_Fun_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_12_Minimal_Cycle_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_13_Cinematic_Tear_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_14_Pop_Vibe_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_15_Mystery_Night_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_16_Morning_Dew_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_17_Rainy_Window_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_18_Soulful_Touch_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_19_Wedding_Grace_Full_HQ.mp3',
  '/audio/piano-shorts/Piano_Short_20_Grand_Power_Full_HQ.mp3',
];

const PIANO_LYRIA: string[] = [
  '/audio/piano-lyria/001_Lyria_Piano_Ethereal_70s.wav',
  '/audio/piano-lyria/002_Logic_Pulse_Analytical.wav',
  '/audio/piano-lyria/003_Gravity_Wave_Ethereal.wav',
  '/audio/piano-lyria/004_Kinetic_Flow_Energetic.wav',
  '/audio/piano-lyria/005_Singularity_Dark.wav',
  '/audio/piano-lyria/006_Nano_World_Curious.wav',
  '/audio/piano-lyria/007_Vacuum_Void_Minimal.wav',
  '/audio/piano-lyria/008_Clockwork_Mechanical.wav',
  '/audio/piano-lyria/009_Entropy_Slow.wav',
  '/audio/piano-lyria/010_Chain_Reaction_Tense.wav',
  '/audio/piano-lyria/011_Celestial_Dawn_Bright.wav',
];

const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));

export const defaultAudioSettings: AudioSettings = {
  master: 0.7,
  sfx: 0.7,
  music: 0.5,
  muteAll: false,
  muteSfx: false,
  muteMusic: false,
};

export const loadAudioSettings = (): AudioSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultAudioSettings };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      master: clamp(parsed.master ?? defaultAudioSettings.master),
      sfx: clamp(parsed.sfx ?? defaultAudioSettings.sfx),
      music: clamp(parsed.music ?? defaultAudioSettings.music),
      muteAll: Boolean(parsed.muteAll),
      muteSfx: Boolean(parsed.muteSfx),
      muteMusic: Boolean(parsed.muteMusic),
    };
  } catch {
    return { ...defaultAudioSettings };
  }
};

const saveAudioSettings = (settings: AudioSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export class AudioEngine {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private whooshOsc: OscillatorNode | null = null;
  private whooshGain: GainNode | null = null;
  private whooshFilter: BiquadFilterNode | null = null;
  private springOsc: OscillatorNode | null = null;
  private springGain: GainNode | null = null;
  private springFilter: BiquadFilterNode | null = null;
  private readonly stepScaleHz = [523.25, 587.33, 659.25, 783.99, 880];
  private stepScaleIndex = 0;
  private lastStepSfxAt = 0;
  private sfxProfile: SfxProfileId = 'default';

  private readonly bgm: HTMLAudioElement;

  constructor(initialSettings = loadAudioSettings()) {
    this.settings = initialSettings;
    // Mix piano-shorts and the new piano-lyria for more variety
    const combinedTracks = [...PIANO_SHORTS, ...PIANO_LYRIA];
    const randomTrack = combinedTracks[Math.floor(Math.random() * combinedTracks.length)];
    this.bgm = new Audio(randomTrack);
    this.bgm.loop = true;
    this.bgm.preload = 'auto';
    this.bgm.crossOrigin = 'anonymous';
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  getRuntimeStatus(): 'locked' | 'ready' {
    if (!this.context) return 'locked';
    return this.context.state === 'running' ? 'ready' : 'locked';
  }

  setSfxProfile(profile: SfxProfileId): void {
    this.sfxProfile = profile;
  }

  private async ensureGraph(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.musicGain = this.context.createGain();

    const source = this.context.createMediaElementSource(this.bgm);
    source.connect(this.musicGain);
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.updateGains();
  }

  private updateGains(): void {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;

    const master = this.settings.muteAll ? 0 : this.settings.master;
    const sfx = this.settings.muteSfx ? 0 : this.settings.sfx;
    const music = this.settings.muteMusic ? 0 : this.settings.music;

    this.masterGain.gain.value = master;
    this.sfxGain.gain.value = sfx * SFX_GAIN_BOOST;
    this.musicGain.gain.value = music;
  }

  setSettings(next: Partial<AudioSettings>): void {
    this.settings = {
      ...this.settings,
      ...next,
      master: clamp(next.master ?? this.settings.master),
      sfx: clamp(next.sfx ?? this.settings.sfx),
      music: clamp(next.music ?? this.settings.music),
    };
    this.updateGains();
    saveAudioSettings(this.settings);
  }

  ensureAudibleDefaults(): void {
    const next: Partial<AudioSettings> = {};
    if (this.settings.muteAll) next.muteAll = false;
    if (this.settings.muteSfx) next.muteSfx = false;
    if (this.settings.muteMusic) next.muteMusic = false;
    if (this.settings.master < 0.2) next.master = 0.7;
    if (this.settings.sfx < 0.2) next.sfx = 0.8;
    if (this.settings.music < 0.1) next.music = 0.4;
    if (Object.keys(next).length > 0) this.setSettings(next);
  }

  async unlock(): Promise<void> {
    await this.ensureGraph();
    if (!this.context) return;
    if (this.context.state === 'suspended') {
      await this.context.resume().catch(() => undefined);
    }
  }

  async toggleMusic(playing: boolean): Promise<void> {
    await this.unlock();
    if (!this.context) return;
    if (this.context.state === 'suspended') return;

    if (playing) {
      await this.bgm.play().catch(() => undefined);
    } else {
      this.bgm.pause();
      this.setPendulumWhoosh(0, 0);
    }
  }

  async setPendulumWhoosh(omega: number, theta: number): Promise<void> {
    await this.ensureGraph();
    if (!this.context || !this.sfxGain) return;
    if (this.context.state === 'suspended') return;

    if (!this.whooshOsc || !this.whooshGain || !this.whooshFilter) {
      this.whooshOsc = this.context.createOscillator();
      this.whooshGain = this.context.createGain();
      this.whooshFilter = this.context.createBiquadFilter();

      this.whooshOsc.type = 'sine';
      this.whooshFilter.type = 'lowpass';
      this.whooshFilter.frequency.value = 1200;
      this.whooshFilter.Q.value = 0.65;
      this.whooshGain.gain.value = 0.0001;

      this.whooshOsc.connect(this.whooshFilter);
      this.whooshFilter.connect(this.whooshGain);
      this.whooshGain.connect(this.sfxGain);
      this.whooshOsc.start();
    }

    const now = this.context.currentTime;
    const speed = Math.abs(omega);
    const norm = clamp(speed / 3.6, 0, 1);
    const directionShift = omega >= 0 ? 10 : -10;

    const targetGain = this.settings.muteAll || this.settings.muteSfx ? 0.0001 : 0.032 * norm;
    const targetFreq = 230 + norm * 180 + directionShift + Math.sin(theta) * 14;
    const targetFilter = 700 + norm * 900;

    this.whooshOsc.frequency.setTargetAtTime(Math.max(90, targetFreq), now, 0.08);
    this.whooshFilter.frequency.setTargetAtTime(Math.max(320, targetFilter), now, 0.09);
    this.whooshGain.gain.setTargetAtTime(Math.max(0.0001, targetGain), now, 0.09);
  }

  async setSpringMotion(velocity: number, displacement: number): Promise<void> {
    await this.ensureGraph();
    if (!this.context || !this.sfxGain) return;
    if (this.context.state === 'suspended') return;

    if (!this.springOsc || !this.springGain || !this.springFilter) {
      this.springOsc = this.context.createOscillator();
      this.springGain = this.context.createGain();
      this.springFilter = this.context.createBiquadFilter();

      this.springOsc.type = 'triangle';
      this.springFilter.type = 'lowpass';
      this.springFilter.frequency.value = 1300;
      this.springFilter.Q.value = 0.9;
      this.springGain.gain.value = 0.0001;

      this.springOsc.connect(this.springFilter);
      this.springFilter.connect(this.springGain);
      this.springGain.connect(this.sfxGain);
      this.springOsc.start();
    }

    const now = this.context.currentTime;
    const speed = Math.abs(velocity);
    const disp = Math.abs(displacement);
    const speedNorm = clamp(speed / 2.8, 0, 1);
    const dispNorm = clamp(disp / 0.9, 0, 1);

    const base = 110 + dispNorm * 160;
    const wobble = speedNorm * 90;
    const targetFreq = base + wobble;
    const targetFilter = 900 + speedNorm * 1800;
    const targetGain = this.settings.muteAll || this.settings.muteSfx ? 0.0001 : 0.055 * speedNorm;

    this.springOsc.frequency.setTargetAtTime(Math.max(60, targetFreq), now, 0.06);
    this.springFilter.frequency.setTargetAtTime(Math.max(350, targetFilter), now, 0.08);
    this.springGain.gain.setTargetAtTime(Math.max(0.0001, targetGain), now, 0.07);
  }

  async triggerSfx(type: 'click' | 'step' | 'drag-start' | 'drag-end' | 'reset' = 'click', intensity = 1): Promise<void> {
    await this.unlock();
    if (!this.context || !this.sfxGain) return;
    if (this.settings.muteAll || this.settings.muteSfx) return;
    if (this.context.state === 'suspended') return;

    const now = this.context.currentTime;
    const profile = this.getSfxProfileConfig();
    const velocity = 0.13 * profile.level * clamp(intensity, 0.2, 1.8);

    if (type === 'click') {
      this.playPianoKey(now, 659.25, 0.2, velocity * 0.9 * profile.clickMul);
      return;
    }

    if (type === 'step') {
      // Use a 5-note pentatonic cycle to keep repeated collisions musical.
      if (now - this.lastStepSfxAt < profile.stepGate) return;
      this.lastStepSfxAt = now;

      const i = this.stepScaleIndex;
      this.stepScaleIndex = (this.stepScaleIndex + 1) % this.stepScaleHz.length;
      const base = this.stepScaleHz[i];
      const lift = clamp(intensity, 0.2, 1.8);
      const main = base * (lift > 1.15 ? 2 : 1);
      const accent = this.stepScaleHz[(i + 2) % this.stepScaleHz.length] * 0.5;

      this.playPianoKey(now, main, 0.24, velocity * 1.02 * profile.stepMul);
      this.playPianoKey(now + 0.032, accent, 0.2, velocity * 0.32 * profile.stepMul);
      return;
    }

    if (type === 'drag-start') {
      this.playPianoKey(now, 493.88, 0.16, velocity * 0.7 * profile.dragMul);
      return;
    }

    if (type === 'drag-end') {
      this.playPianoKey(now, 587.33, 0.18, velocity * 0.78 * profile.dragMul);
      return;
    }

    // reset
    this.playPianoKey(now, 523.25, 0.18, velocity * 0.62 * profile.resetMul);
    this.playPianoKey(now + 0.05, 659.25, 0.2, velocity * 0.58 * profile.resetMul);
    this.playPianoKey(now + 0.1, 783.99, 0.23, velocity * 0.66 * profile.resetMul);
  }

  private getSfxProfileConfig(): {
    level: number;
    stepGate: number;
    stepMul: number;
    clickMul: number;
    dragMul: number;
    resetMul: number;
  } {
    if (this.sfxProfile === 'collision') {
      return { level: 1.15, stepGate: 0.02, stepMul: 1.15, clickMul: 0.95, dragMul: 0.9, resetMul: 1 };
    }
    if (this.sfxProfile === 'cradle') {
      return { level: 1.25, stepGate: 0.018, stepMul: 1.2, clickMul: 1, dragMul: 0.85, resetMul: 1 };
    }
    if (this.sfxProfile === 'coaster') {
      return { level: 0.95, stepGate: 0.035, stepMul: 0.9, clickMul: 0.95, dragMul: 0.85, resetMul: 0.9 };
    }
    if (this.sfxProfile === 'pendulum') {
      return { level: 0.9, stepGate: 0.04, stepMul: 0.85, clickMul: 0.9, dragMul: 0.8, resetMul: 0.9 };
    }
    return { level: 1, stepGate: 0.03, stepMul: 1, clickMul: 1, dragMul: 1, resetMul: 1 };
  }

  private playPianoKey(start: number, baseHz: number, duration: number, velocity: number): void {
    if (!this.context || !this.sfxGain) return;

    const partials = [
      { ratio: 1, amp: 1, type: 'triangle' as OscillatorType },
      { ratio: 2.01, amp: 0.42, type: 'sine' as OscillatorType },
      { ratio: 3.02, amp: 0.2, type: 'sine' as OscillatorType },
      { ratio: 4.15, amp: 0.11, type: 'sine' as OscillatorType },
    ];

    for (const part of partials) {
      const osc = this.context.createOscillator();
      const env = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const peak = Math.max(0.0001, velocity * part.amp);

      osc.type = part.type;
      osc.frequency.setValueAtTime(Math.max(60, baseHz * part.ratio), start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(50, baseHz * part.ratio * 0.996), start + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4200, start);
      filter.frequency.exponentialRampToValueAtTime(1400, start + duration);
      filter.Q.value = 0.5;

      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(peak, start + 0.006);
      env.gain.exponentialRampToValueAtTime(peak * 0.25, start + duration * 0.2);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    }
  }

  private playTone(
    start: number,
    fromHz: number,
    toHz: number,
    duration: number,
    peakGain: number,
    type: OscillatorType,
  ): void {
    if (!this.context || !this.sfxGain) return;

    const osc = this.context.createOscillator();
    const env = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, fromHz), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, toHz), start + duration);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), start + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration);
  }

  private playNoise(start: number, duration: number, peakGain: number, cutoffHz: number): void {
    if (!this.context || !this.sfxGain) return;

    const sampleRate = this.context.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const env = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = Math.max(300, cutoffHz);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), start + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    source.start(start);
    source.stop(start + duration);
  }
}
