import { SpringMass } from '../simulations/springMass';

const slider = (
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

  const input = document.createElement('input');
  const valueEl = document.createElement('span');

  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  valueEl.textContent = value.toFixed(2);

  input.addEventListener('input', () => {
    const next = Number(input.value);
    valueEl.textContent = next.toFixed(2);
    onChange(next);
  });

  wrapper.append(input, valueEl);
  root.append(wrapper);
};

export const mountSpringControls = (
  root: HTMLElement,
  model: SpringMass,
  onMutate: () => void,
): void => {
  root.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Spring Controls';
  title.className = 'section-title';

  const controls = document.createElement('div');
  controls.className = 'controls';
  const params = model.getParams();

  slider(controls, 'Mass (kg)', 0.2, 5, 0.05, params.mass, (v) => {
    model.setParam('mass', v);
    onMutate();
  });

  slider(controls, 'Stiffness (N/m)', 2, 40, 0.2, params.stiffness, (v) => {
    model.setParam('stiffness', v);
    onMutate();
  });

  slider(controls, 'Damping', 0, 2, 0.01, params.damping, (v) => {
    model.setParam('damping', v);
    onMutate();
  });

  slider(controls, 'Initial x (m)', -1, 1, 0.01, params.initialDisplacement, (v) => {
    model.setState([v, 0]);
    model.setParam('initialDisplacement', v);
    model.setParam('initialVelocity', 0);
    onMutate();
  });

  root.append(title, controls);
};
