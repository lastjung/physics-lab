import './styles.css';

import { readUrlState, replaceUrlState } from './core/urlState';
import { pendulumPlugin } from './plugins/PendulumPlugin';
import { springMassPlugin } from './plugins/SpringMassPlugin';
import type { ActivePlugin, SimulationPlugin } from './plugins/types';
import { getPresetById, simulationPresets } from './simulations/registry';

const app = document.getElementById('app');
if (!app) throw new Error('Missing root element');

const plugins: Record<string, SimulationPlugin> = {
  [pendulumPlugin.id]: pendulumPlugin,
  [springMassPlugin.id]: springMassPlugin,
};

const urlState = readUrlState();
const activePreset = getPresetById(urlState.simId);

const shell = document.createElement('div');
shell.className = 'app-shell';

const topbar = document.createElement('header');
topbar.className = 'topbar panel';

const title = document.createElement('h1');
title.textContent = 'Physics Lab';

const gameLibrary = document.createElement('div');
gameLibrary.className = 'game-library';

const mobileMenuButton = document.createElement('button');
mobileMenuButton.className = 'secondary mobile-menu-btn';
mobileMenuButton.textContent = 'Menu';

for (const preset of simulationPresets) {
  const button = document.createElement('button');
  button.className = preset.id === activePreset.id ? 'game-btn active' : 'game-btn secondary';
  button.textContent = preset.name;
  button.addEventListener('click', () => {
    const next = new URLSearchParams();
    next.set('sim', preset.id);
    for (const [key, value] of Object.entries(preset.params)) {
      next.set(key, String(value));
    }
    window.location.search = next.toString();
  });
  gameLibrary.append(button);
}

topbar.append(title, gameLibrary, mobileMenuButton);

const layout = document.createElement('div');
layout.className = 'layout';

const stagePanel = document.createElement('section');
stagePanel.className = 'panel';
const menuPanel = document.createElement('aside');
menuPanel.className = 'panel menu-panel';

const canvas = document.createElement('canvas');
canvas.width = 780;
canvas.height = 520;
stagePanel.append(canvas);

const commonMenu = document.createElement('section');
commonMenu.className = 'menu-section';
const commonTitle = document.createElement('h3');
commonTitle.className = 'section-title';
commonTitle.textContent = 'Global Controls';

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
stepFastButton.textContent = 'Step x12';

controlsRow.append(playPauseButton, resetButton, stepButton, stepFastButton);

const statsEl = document.createElement('div');
statsEl.className = 'stats';

commonMenu.append(commonTitle, controlsRow, statsEl);

const gameMenu = document.createElement('section');
gameMenu.className = 'menu-section';

menuPanel.append(commonMenu, gameMenu);
layout.append(stagePanel, menuPanel);
shell.append(topbar, layout);
app.append(shell);

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
  menuRoot: gameMenu,
  initialValues: urlState.values,
  presetValues: activePreset.params,
  onStats: (text) => {
    statsEl.textContent = text;
  },
  onStateChange: (values) => {
    syncUrlState(activePreset.id, values);
  },
});

const refreshPlayLabel = () => {
  playPauseButton.textContent = active.isRunning() ? 'Pause' : 'Play';
};

playPauseButton.addEventListener('click', () => {
  if (active.isRunning()) {
    active.pause();
  } else {
    active.play();
  }
  refreshPlayLabel();
});

resetButton.addEventListener('click', () => {
  active.pause();
  active.reset();
  refreshPlayLabel();
});

stepButton.addEventListener('click', () => {
  active.pause();
  active.step(1);
  refreshPlayLabel();
});

stepFastButton.addEventListener('click', () => {
  active.pause();
  active.step(12);
  refreshPlayLabel();
});

mobileMenuButton.addEventListener('click', () => {
  menuPanel.classList.toggle('open');
});

window.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;

  if (event.code === 'Space') {
    event.preventDefault();
    if (active.isRunning()) {
      active.pause();
    } else {
      active.play();
    }
    refreshPlayLabel();
    return;
  }

  if (event.key === 'r' || event.key === 'R') {
    active.pause();
    active.reset();
    refreshPlayLabel();
    return;
  }

  if (event.code === 'Period') {
    active.pause();
    active.step(event.shiftKey ? 12 : 1);
    refreshPlayLabel();
  }
});

window.addEventListener('beforeunload', () => {
  active.destroy();
});

refreshPlayLabel();
