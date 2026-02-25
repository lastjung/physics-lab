import { DampedPendulum } from '../simulations/dampedPendulum';

const makeSlider = (
  root: HTMLElement,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  onChange: (value: number) => void,
): void => {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.textContent = value.toFixed(2);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    valueEl.textContent = next.toFixed(2);
    onChange(next);
  });

  wrapper.append(input, valueEl);
  root.append(wrapper);
};

export const mountPendulumControls = (
  root: HTMLElement,
  model: DampedPendulum,
  onMutate: () => void,
): void => {
  root.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Pendulum Controls';
  title.className = 'section-title';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const params = model.getParams();

  makeSlider(controls, 'Length (m)', 0.6, 2.4, 0.05, params.length, (value) => {
    model.setParam('length', value);
    onMutate();
  });

  makeSlider(controls, 'Gravity (m/s^2)', 1, 20, 0.1, params.gravity, (value) => {
    model.setParam('gravity', value);
    onMutate();
  });

  makeSlider(controls, 'Damping', 0, 1.2, 0.01, params.damping, (value) => {
    model.setParam('damping', value);
    onMutate();
  });

  makeSlider(controls, 'Initial angle (rad)', -2.8, 2.8, 0.01, params.initialAngle, (value) => {
    model.setState([value, 0]);
    model.setParam('initialAngle', value);
    model.setParam('initialAngularVelocity', 0);
    onMutate();
  });

  root.append(title, controls);
};
