import { CartPendulumEngine } from '../simulations/cartPendulumEngine';

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

  const valueEl = document.createElement('span');
  valueEl.className = 'control-value';
  valueEl.textContent = value.toFixed(2);

  input.addEventListener('input', () => {
    const next = Number(input.value);
    valueEl.textContent = next.toFixed(2);
    onChange(next);
  });

  head.append(labelEl, valueEl);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountCartPendulumEngineControls = (
  root: HTMLElement,
  model: CartPendulumEngine,
  onMutate: () => void,
): void => {
  root.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Cart + Pendulum (Engine)';

  const controls = document.createElement('div');
  controls.className = 'controls';
  const p = model.getParams();

  makeSlider(controls, 'Cart Mass', 0.5, 4, 0.05, p.cartMass, (value) => {
    model.setParam('cartMass', value);
    onMutate();
  });

  makeSlider(controls, 'Bob Mass', 0.1, 2.5, 0.05, p.bobMass, (value) => {
    model.setParam('bobMass', value);
    onMutate();
  });

  makeSlider(controls, 'Rod Length (m)', 0.45, 1.5, 0.01, p.length, (value) => {
    model.setParam('length', value);
    model.reset();
    onMutate();
  });

  makeSlider(controls, 'Cart Spring', 0, 8, 0.05, p.cartSpring, (value) => {
    model.setParam('cartSpring', value);
    onMutate();
  });

  makeSlider(controls, 'Cart Damping', 0, 1, 0.01, p.cartDamping, (value) => {
    model.setParam('cartDamping', value);
    onMutate();
  });

  makeSlider(controls, 'Linear Damping', 0, 0.2, 0.001, p.linearDamping, (value) => {
    model.setParam('linearDamping', value);
    onMutate();
  });

  makeSlider(controls, 'Drive Amp', 0, 3, 0.05, p.driveAmplitude, (value) => {
    model.setParam('driveAmplitude', value);
    onMutate();
  });

  makeSlider(controls, 'Drive Freq', 0.1, 4, 0.05, p.driveFrequency, (value) => {
    model.setParam('driveFrequency', value);
    onMutate();
  });

  makeSlider(controls, 'Joint Iter', 4, 30, 1, p.iterations, (value) => {
    model.setParam('iterations', Math.round(value));
    onMutate();
  });

  makeSlider(controls, 'Initial Theta', -2.9, 2.9, 0.01, p.initialTheta, (value) => {
    model.setParam('initialTheta', value);
    model.setParam('initialOmega', 0);
    model.reset();
    onMutate();
  });

  root.append(title, controls);
};
