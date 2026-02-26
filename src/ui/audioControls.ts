import type { AudioEngine } from '../core/audio/audioEngine';

const slider = (
  root: HTMLElement,
  label: string,
  value: number,
  enabled: boolean,
  onInput: (value: number) => void,
  onEnabledChange: (enabled: boolean) => void,
): void => {
  const wrap = document.createElement('label');
  wrap.className = 'audio-slider';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '1';
  input.step = '0.01';
  input.value = String(value);

  const head = document.createElement('div');
  head.className = 'audio-slider-head';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;

  const muteWrap = document.createElement('label');
  muteWrap.className = 'audio-inline-mute';
  const muteInput = document.createElement('input');
  muteInput.type = 'checkbox';
  muteInput.checked = enabled;
  muteInput.addEventListener('change', () => onEnabledChange(muteInput.checked));
  const muteText = document.createElement('span');
  muteText.textContent = 'On';
  muteWrap.append(muteInput, muteText);

  const valueEl = document.createElement('span');
  valueEl.className = 'audio-value';
  valueEl.textContent = `${Math.round(value * 100)}%`;

  input.addEventListener('input', () => {
    const next = Number(input.value);
    valueEl.textContent = `${Math.round(next * 100)}%`;
    onInput(next);
  });

  head.append(labelEl, muteWrap, valueEl);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountAudioControls = (
  root: HTMLElement,
  audio: AudioEngine,
  onChange?: () => void,
  showTitle = true,
): void => {
  root.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'controls';
  const status = document.createElement('div');
  status.className = 'audio-status';
  status.textContent = `Audio: ${audio.getRuntimeStatus() === 'ready' ? 'Ready' : 'Locked (click once)'}`;

  const s = audio.getSettings();

  slider(
    controls,
    'Master',
    s.master,
    !s.muteAll,
    (v) => {
      audio.setSettings({ master: v });
    },
    (enabled) => {
      const muted = !enabled;
      // Master mute acts as global switch for all channels.
      audio.setSettings({ muteAll: muted, muteSfx: muted, muteMusic: muted });
      onChange?.();
    },
  );

  slider(
    controls,
    'SFX',
    s.sfx,
    !s.muteSfx,
    (v) => {
      audio.setSettings({ sfx: v });
    },
    (enabled) => {
      const muted = !enabled;
      audio.setSettings({ muteSfx: muted });
      onChange?.();
    },
  );

  slider(
    controls,
    'Music',
    s.music,
    !s.muteMusic,
    (v) => {
      audio.setSettings({ music: v });
    },
    (enabled) => {
      const muted = !enabled;
      audio.setSettings({ muteMusic: muted });
      onChange?.();
    },
  );

  if (showTitle) {
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Audio';
    root.append(sectionTitle, status, controls);
    return;
  }

  root.append(status, controls);
};
