import { DoublePendulumEngine } from '../simulations/doublePendulumEngine';

const makeSlider = (
  root: HTMLElement,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  onChange: (value: number) => void,
): void => {
  const wrap = document.createElement('label');
  const head = document.createElement('div');
  head.className = 'control-head';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);

  const v = document.createElement('span');
  v.className = 'control-value';
  v.textContent = value.toFixed(2);

  input.addEventListener('input', () => {
    const next = Number(input.value);
    v.textContent = next.toFixed(2);
    onChange(next);
  });

  head.append(labelEl, v);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountDoublePendulumEngineControls = (
  root: HTMLElement,
  model: DoublePendulumEngine,
  onMutate: () => void,
): void => {
  root.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Double Pendulum (Engine)';

  const controls = document.createElement('div');
  controls.className = 'controls';
  const p = model.getParams();

  makeSlider(controls, 'Length 1 (m)', 0.5, 1.7, 0.02, p.length1, (value) => {
    model.setParam('length1', value);
    model.reset();
    onMutate();
  });

  makeSlider(controls, 'Length 2 (m)', 0.5, 1.7, 0.02, p.length2, (value) => {
    model.setParam('length2', value);
    model.reset();
    onMutate();
  });

  makeSlider(controls, 'Mass 1', 0.2, 3, 0.05, p.mass1, (value) => {
    model.setParam('mass1', value);
    onMutate();
  });

  makeSlider(controls, 'Mass 2', 0.2, 3, 0.05, p.mass2, (value) => {
    model.setParam('mass2', value);
    onMutate();
  });

  makeSlider(controls, 'Damping', 0, 0.2, 0.005, p.damping, (value) => {
    model.setParam('damping', value);
    onMutate();
  });

  makeSlider(controls, 'Joint Iter', 4, 30, 1, p.iterations, (value) => {
    model.setParam('iterations', Math.round(value));
    onMutate();
  });

  makeSlider(controls, 'Theta 1 (rad)', -2.9, 2.9, 0.01, p.initialTheta1, (value) => {
    model.setParam('initialTheta1', value);
    model.setParam('initialOmega1', 0);
    model.setParam('initialOmega2', 0);
    model.reset();
    onMutate();
  });

  makeSlider(controls, 'Theta 2 (rad)', -2.9, 2.9, 0.01, p.initialTheta2, (value) => {
    model.setParam('initialTheta2', value);
    model.setParam('initialOmega1', 0);
    model.setParam('initialOmega2', 0);
    model.reset();
    onMutate();
  });

  root.append(title, controls);
};
