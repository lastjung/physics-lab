import './styles.css';

import { AudioEngine } from './core/audio/audioEngine';
import { readUrlState, replaceUrlState } from './core/urlState';
import { billiardsPlugin } from './plugins/BilliardsPlugin';
import { hangingChainPlugin } from './plugins/HangingChainPlugin';
import { pileAttractPlugin } from './plugins/PileAttractPlugin';
import { doublePendulumComparePlugin } from './plugins/DoublePendulumComparePlugin';
import { carSuspensionPlugin } from './plugins/CarSuspensionPlugin';
import { cartPendulumPlugin } from './plugins/CartPendulumPlugin';
import { collisionLabPlugin } from './plugins/CollisionLabPlugin';
import { coupledSpringPlugin } from './plugins/CoupledSpringPlugin';
import { doublePendulumPlugin } from './plugins/DoublePendulumPlugin';
import { drivenPendulumPlugin } from './plugins/DrivenPendulumPlugin';
import { newtonsCradlePlugin } from './plugins/NewtonsCradlePlugin';
import { orbitPlugin } from './plugins/OrbitPlugin';
import { pendulumPlugin } from './plugins/PendulumPlugin';
import { rollerCoasterPlugin } from './plugins/RollerCoasterPlugin';
import { rollerCoasterTwoBallsPlugin } from './plugins/RollerCoasterTwoBallsPlugin';
import { springMassPlugin } from './plugins/SpringMassPlugin';
import type { ActivePlugin, SimulationPlugin } from './plugins/types';
import { getPresetById, simulationPresets } from './simulations/registry';
import { mountAudioControls } from './ui/audioControls';

const app = document.getElementById('app');
if (!app) throw new Error('Missing root element');

const RECENT_KEY = 'physics-lab-recent-v1';
const FAVORITE_KEY = 'physics-lab-favorite-v1';

const loadRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
};

const saveRecent = (items: string[]): void => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 3)));
};

const loadFavorite = (): string | null => localStorage.getItem(FAVORITE_KEY);
const saveFavorite = (id: string | null): void => {
  if (!id) {
    localStorage.removeItem(FAVORITE_KEY);
    return;
  }
  localStorage.setItem(FAVORITE_KEY, id);
};

const choosePreset = (presetId: string): void => {
  const preset = getPresetById(presetId);
  const nextRecent = [preset.id, ...loadRecent().filter((id) => id !== preset.id)];
  saveRecent(nextRecent);

  const next = new URLSearchParams();
  next.set('sim', preset.id);
  for (const [key, value] of Object.entries(preset.params)) {
    next.set(key, String(value));
  }
  window.location.search = next.toString();
};

const plugins: Record<string, SimulationPlugin> = {
  [billiardsPlugin.id]: billiardsPlugin,
  [carSuspensionPlugin.id]: carSuspensionPlugin,
  [cartPendulumPlugin.id]: cartPendulumPlugin,
  [collisionLabPlugin.id]: collisionLabPlugin,
  [coupledSpringPlugin.id]: coupledSpringPlugin,
  [doublePendulumPlugin.id]: doublePendulumPlugin,
  [drivenPendulumPlugin.id]: drivenPendulumPlugin,
  [newtonsCradlePlugin.id]: newtonsCradlePlugin,
  [orbitPlugin.id]: orbitPlugin,
  [pendulumPlugin.id]: pendulumPlugin,
  [rollerCoasterPlugin.id]: rollerCoasterPlugin,
  [rollerCoasterTwoBallsPlugin.id]: rollerCoasterTwoBallsPlugin,
  [springMassPlugin.id]: springMassPlugin,
  [hangingChainPlugin.id]: hangingChainPlugin,
  [pileAttractPlugin.id]: pileAttractPlugin,
  [doublePendulumComparePlugin.id]: doublePendulumComparePlugin,
};

const urlState = readUrlState();
const activePreset = getPresetById(urlState.simId);
saveRecent([activePreset.id, ...loadRecent().filter((id) => id !== activePreset.id)]);

const shell = document.createElement('div');
shell.className = 'app-shell';

const createMenuSection = (titleText: string, open = true, lockOpen = false) => {
  const section = document.createElement('section');
  section.className = 'menu-section';
  const details = document.createElement('details');
  details.className = 'menu-accordion';
  details.open = open;
  const summary = document.createElement('summary');
  summary.className = 'menu-summary';
  summary.textContent = titleText;
  const body = document.createElement('div');
  body.className = 'menu-body';
  details.append(summary, body);
  if (lockOpen) {
    details.addEventListener('toggle', () => {
      if (!details.open) details.open = true;
    });
  }
  section.append(details);
  return { section, body };
};

const topbar = document.createElement('header');
topbar.className = 'topbar panel';

const brandStack = document.createElement('div');
brandStack.className = 'brand-stack';

const title = document.createElement('h1');
title.textContent = 'Physics Lab';
title.className = 'app-title';

const titleNote = document.createElement('p');
titleNote.className = 'title-note';
titleNote.textContent = 'Interactive mechanics sandbox';

brandStack.append(title, titleNote);

const quickLibrary = document.createElement('div');
quickLibrary.className = 'game-library';
const quickLibraryRow = document.createElement('div');
quickLibraryRow.className = 'game-library-row';
simulationPresets.forEach((preset) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = preset.id === activePreset.id ? 'game-btn active' : 'game-btn secondary';
  button.textContent = preset.name;
  button.addEventListener('click', () => choosePreset(preset.id));
  quickLibraryRow.append(button);
});
quickLibrary.append(quickLibraryRow);

const mobileMenuButton = document.createElement('button');
mobileMenuButton.className = 'secondary mobile-menu-btn';
mobileMenuButton.textContent = 'Menu';
mobileMenuButton.setAttribute('aria-expanded', 'false');
mobileMenuButton.setAttribute('aria-controls', 'mobile-menu-sheet');

topbar.append(brandStack, mobileMenuButton);

const tabbar = document.createElement('section');
tabbar.className = 'panel tabbar';
tabbar.append(quickLibrary);

const layout = document.createElement('div');
layout.className = 'layout';

const stagePanel = document.createElement('section');
stagePanel.className = 'panel stage-panel';
const menuPanel = document.createElement('aside');
menuPanel.className = 'panel menu-panel';
menuPanel.id = 'mobile-menu-sheet';

const librarySection = document.createElement('section');
librarySection.className = 'library-section';
const libraryTitle = document.createElement('h3');
libraryTitle.className = 'section-title';
libraryTitle.textContent = 'Now Playing';

const recentRow = document.createElement('div');
recentRow.className = 'recent-row';
const recentTitle = document.createElement('span');
recentTitle.className = 'recent-title';
recentTitle.textContent = 'Recent:';
recentRow.append(recentTitle);

for (const id of loadRecent()) {
  const preset = getPresetById(id);
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = id === activePreset.id ? 'mini-chip active' : 'mini-chip';
  chip.textContent = preset.name;
  chip.addEventListener('click', () => choosePreset(preset.id));
  recentRow.append(chip);
}

const cardGrid = document.createElement('div');
cardGrid.className = 'game-card-grid';
const favoriteId = loadFavorite();
const focusedPresetIds = [activePreset.id];
for (const id of [...loadRecent(), ...(favoriteId ? [favoriteId] : [])]) {
  if (focusedPresetIds.includes(id)) continue;
  focusedPresetIds.push(id);
  if (focusedPresetIds.length >= 3) break;
}
const focusedPresets = focusedPresetIds.map((id) => getPresetById(id));

for (const preset of focusedPresets) {
  const card = document.createElement('article');
  card.className = preset.id === activePreset.id ? 'game-card active' : 'game-card';

  const top = document.createElement('div');
  top.className = 'game-card-top';

  const name = document.createElement('strong');
  name.textContent = preset.name;

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = preset.category;

  const favorite = document.createElement('button');
  favorite.type = 'button';
  favorite.className = favoriteId === preset.id ? 'favorite-btn active' : 'favorite-btn';
  favorite.textContent = favoriteId === preset.id ? '★' : '☆';
  favorite.title = 'Set favorite';
  favorite.addEventListener('click', (event) => {
    event.stopPropagation();
    const nextFavorite = loadFavorite() === preset.id ? null : preset.id;
    saveFavorite(nextFavorite);
    window.location.reload();
  });

  top.append(name, badge, favorite);

  const summary = document.createElement('p');
  summary.className = 'game-summary';
  summary.textContent = preset.summary;

  card.append(top, summary);
  card.addEventListener('click', () => choosePreset(preset.id));
  cardGrid.append(card);
}

librarySection.append(libraryTitle, recentRow, cardGrid);

const canvas = document.createElement('canvas');
canvas.width = 780;
canvas.height = 520;

const stageCanvasWrap = document.createElement('div');
stageCanvasWrap.className = 'stage-canvas-wrap';
const hudEl = document.createElement('div');
hudEl.className = 'stage-hud';
stageCanvasWrap.append(canvas, hudEl);

stagePanel.append(librarySection, stageCanvasWrap);

const commonMenu = createMenuSection('Global Controls', true);

const controlsRow = document.createElement('div');
controlsRow.className = 'buttons';

const playPauseButton = document.createElement('button');
playPauseButton.textContent = 'Play';

const resetButton = document.createElement('button');
resetButton.className = 'secondary';
resetButton.textContent = 'Reset';

const stepButton = document.createElement('button');
stepButton.className = 'secondary';
stepButton.textContent = 'Step';

const stepFastButton = document.createElement('button');
stepFastButton.className = 'secondary';
stepFastButton.textContent = 'x2';

controlsRow.append(playPauseButton, resetButton, stepButton, stepFastButton);

const statsEl = document.createElement('div');
statsEl.className = 'stats';

commonMenu.body.append(controlsRow, statsEl);

const audioMenu = createMenuSection('Audio', true, true);

const gameHelpMenu = createMenuSection(`${activePreset.name} Guide`, false);
const gameHelpText = document.createElement('div');
gameHelpText.className = 'help-text';
gameHelpText.textContent = activePreset.help ?? activePreset.summary;
gameHelpMenu.body.append(gameHelpText);

const gameMenu = createMenuSection('Game Controls', true);

menuPanel.append(commonMenu.section, audioMenu.section, gameHelpMenu.section, gameMenu.section);
layout.append(stagePanel, menuPanel);
shell.append(topbar, tabbar, layout);
app.append(shell);

const audio = new AudioEngine();
let soundEnabled = false;
let playOnlySound = true;
const resolveSfxProfile = (): 'default' | 'pendulum' | 'collision' | 'cradle' | 'coaster' => {
  if (activePreset.id === 'collision-lab' || activePreset.id === 'billiards' || activePreset.id === 'pile-attract' || activePreset.id === 'hanging-chain') return 'collision';
  if (activePreset.id === 'newtons-cradle') return 'cradle';
  if (activePreset.id === 'roller-coaster' || activePreset.id === 'roller-coaster-two-balls') return 'coaster';
  if (
    activePreset.pluginId === 'pendulum' || 
    activePreset.pluginId === 'double-pendulum' || 
    activePreset.pluginId === 'driven-pendulum' ||
    activePreset.pluginId === 'double-pendulum-compare'
  ) {
    return 'pendulum';
  }
  return 'default';
};
audio.setSfxProfile(resolveSfxProfile());
const renderAudioControls = () => {
  mountAudioControls(audioMenu.body, audio, renderAudioControls, false);
  const modeRow = document.createElement('label');
  modeRow.className = 'audio-inline-mute';
  const modeInput = document.createElement('input');
  modeInput.type = 'checkbox';
  modeInput.checked = playOnlySound;
  const modeText = document.createElement('span');
  modeText.textContent = 'Play only';
  modeInput.addEventListener('change', () => {
    playOnlySound = modeInput.checked;
    renderAudioControls();
  });
  modeRow.append(modeInput, modeText);
  audioMenu.body.append(modeRow);
};
renderAudioControls();
const unlockAudio = () => {
  audio.ensureAudibleDefaults();
  void audio.unlock();
  renderAudioControls();
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

let urlSyncHandle: number | null = null;
const syncUrlState = (simId: string, values: Record<string, number>) => {
  if (urlSyncHandle != null) return;
  urlSyncHandle = window.setTimeout(() => {
    urlSyncHandle = null;
    replaceUrlState(simId, values);
  }, 120);
};

const plugin = plugins[activePreset.pluginId];
if (!plugin) throw new Error(`Plugin not registered: ${activePreset.pluginId}`);

const active: ActivePlugin = plugin.create({
  canvas,
  menuRoot: gameMenu.body,
  initialValues: urlState.values,
  presetValues: activePreset.params,
  onStats: (line1, line2) => {
    statsEl.innerHTML = `${line1}<br>${line2}`;
    hudEl.textContent = `${line1} | ${line2}`;
  },
  onStateChange: (values) => {
    syncUrlState(activePreset.id, values);
  },
  onSfx: (type, intensity) => {
    if (playOnlySound && !soundEnabled) return;
    audio.triggerSfx(type, intensity);
  },
  onPendulumMotion: (omega, theta) => {
    if (playOnlySound && !soundEnabled) return;
    audio.setPendulumWhoosh(omega, theta);
  },
  onSpringMotion: (velocity, displacement) => {
    if (playOnlySound && !soundEnabled) return;
    audio.setSpringMotion(velocity, displacement);
  },
});

const refreshPlayLabel = () => {
  playPauseButton.textContent = active.isRunning() ? 'Pause' : 'Play';
};

playPauseButton.addEventListener('click', () => {
  if (active.isRunning()) {
    active.pause();
    soundEnabled = false;
    audio.toggleMusic(false);
    audio.setPendulumWhoosh(0, 0);
    audio.setSpringMotion(0, 0);
  } else {
    active.play();
    soundEnabled = true;
    audio.toggleMusic(true);
  }
  if (!playOnlySound || soundEnabled) audio.triggerSfx('click', 0.9);
  refreshPlayLabel();
});

resetButton.addEventListener('click', () => {
  active.pause();
  soundEnabled = false;
  audio.toggleMusic(false);
  audio.setPendulumWhoosh(0, 0);
  audio.setSpringMotion(0, 0);
  active.reset();
  if (!playOnlySound) audio.triggerSfx('reset', 1);
  refreshPlayLabel();
});

stepButton.addEventListener('click', () => {
  active.pause();
  soundEnabled = false;
  audio.toggleMusic(false);
  audio.setPendulumWhoosh(0, 0);
  audio.setSpringMotion(0, 0);
  active.step(1);
  if (!playOnlySound) audio.triggerSfx('step', 0.9);
  refreshPlayLabel();
});

stepFastButton.addEventListener('click', () => {
  active.pause();
  soundEnabled = false;
  audio.toggleMusic(false);
  audio.setPendulumWhoosh(0, 0);
  audio.setSpringMotion(0, 0);
  active.step(2);
  if (!playOnlySound) audio.triggerSfx('step', 1);
  refreshPlayLabel();
});

mobileMenuButton.addEventListener('click', () => {
  const isOpen = menuPanel.classList.toggle('open');
  mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
  mobileMenuButton.textContent = isOpen ? 'Close' : 'Menu';
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuPanel.classList.contains('open')) {
    menuPanel.classList.remove('open');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    mobileMenuButton.textContent = 'Menu';
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;

  if (event.code === 'Space') {
    event.preventDefault();
    if (active.isRunning()) {
      active.pause();
      soundEnabled = false;
      audio.toggleMusic(false);
      audio.setPendulumWhoosh(0, 0);
      audio.setSpringMotion(0, 0);
    } else {
      active.play();
      soundEnabled = true;
      audio.toggleMusic(true);
    }
    if (!playOnlySound || soundEnabled) audio.triggerSfx('click', 0.9);
    refreshPlayLabel();
    return;
  }

  if (event.key === 'r' || event.key === 'R') {
    active.pause();
    soundEnabled = false;
    audio.toggleMusic(false);
    audio.setPendulumWhoosh(0, 0);
    audio.setSpringMotion(0, 0);
    active.reset();
    if (!playOnlySound) audio.triggerSfx('reset', 1);
    refreshPlayLabel();
    return;
  }

  if (event.code === 'Period') {
    active.pause();
    soundEnabled = false;
    audio.toggleMusic(false);
    audio.setPendulumWhoosh(0, 0);
    audio.setSpringMotion(0, 0);
    active.step(event.shiftKey ? 2 : 1);
    if (!playOnlySound) audio.triggerSfx('step', event.shiftKey ? 1 : 0.9);
    refreshPlayLabel();
  }
});

window.addEventListener('beforeunload', () => {
  active.destroy();
});

refreshPlayLabel();
