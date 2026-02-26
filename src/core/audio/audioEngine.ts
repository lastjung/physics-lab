export interface AudioSettings {
  master: number;
  sfx: number;
  music: number;
  muteAll: boolean;
  muteSfx: boolean;
  muteMusic: boolean;
}

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

  private readonly bgm: HTMLAudioElement;

  constructor(initialSettings = loadAudioSettings()) {
    this.settings = initialSettings;
    const randomTrack = PIANO_SHORTS[Math.floor(Math.random() * PIANO_SHORTS.length)];
    this.bgm = new Audio(randomTrack);
    this.bgm.loop = true;
    this.bgm.preload = 'auto';
    this.bgm.crossOrigin = 'anonymous';
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
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

  async toggleMusic(playing: boolean): Promise<void> {
    await this.ensureGraph();
    if (!this.context) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

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

      this.whooshOsc.type = 'sawtooth';
      this.whooshFilter.type = 'bandpass';
      this.whooshFilter.frequency.value = 780;
      this.whooshFilter.Q.value = 1.2;
      this.whooshGain.gain.value = 0.0001;

      this.whooshOsc.connect(this.whooshFilter);
      this.whooshFilter.connect(this.whooshGain);
      this.whooshGain.connect(this.sfxGain);
      this.whooshOsc.start();
    }

    const now = this.context.currentTime;
    const speed = Math.abs(omega);
    const norm = clamp(speed / 4.2, 0, 1);
    const directionShift = omega >= 0 ? 20 : -20;

    const targetGain = this.settings.muteAll || this.settings.muteSfx ? 0.0001 : 0.065 * norm;
    const targetFreq = 170 + norm * 440 + directionShift + Math.sin(theta) * 20;
    const targetFilter = 620 + norm * 1400;

    this.whooshOsc.frequency.setTargetAtTime(Math.max(80, targetFreq), now, 0.05);
    this.whooshFilter.frequency.setTargetAtTime(Math.max(300, targetFilter), now, 0.06);
    this.whooshGain.gain.setTargetAtTime(Math.max(0.0001, targetGain), now, 0.06);
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
    await this.ensureGraph();
    if (!this.context || !this.sfxGain) return;
    if (this.settings.muteAll || this.settings.muteSfx) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const now = this.context.currentTime;
    const gain = 0.12 * clamp(intensity, 0.2, 1.8);

    if (type === 'click') {
      this.playTone(now, 880, 620, 0.035, gain * 0.65, 'square');
      return;
    }

    if (type === 'step') {
      // A short impact-like sound: low thump + bright transient.
      this.playTone(now, 240, 120, 0.08, gain, 'triangle');
      this.playNoise(now, 0.03, gain * 0.35, 1700);
      return;
    }

    if (type === 'drag-start') {
      this.playTone(now, 360, 520, 0.05, gain * 0.75, 'sine');
      return;
    }

    if (type === 'drag-end') {
      this.playTone(now, 520, 320, 0.06, gain * 0.75, 'sine');
      return;
    }

    // reset
    this.playTone(now, 420, 360, 0.06, gain * 0.6, 'triangle');
    this.playTone(now + 0.045, 360, 300, 0.06, gain * 0.55, 'triangle');
    this.playTone(now + 0.09, 300, 220, 0.08, gain * 0.65, 'triangle');
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
