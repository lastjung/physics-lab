import { OrbitSim } from '../simulations/orbit';

const slider = (root: HTMLElement, label: string, min: number, max: number, step: number, value: number, onChange: (v: number) => void) => {
  const wrap = document.createElement('label');
  const head = document.createElement('div');
  head.className = 'control-head';
  const name = document.createElement('span');
  name.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const val = document.createElement('span');
  val.className = 'control-value';
  val.textContent = value.toFixed(2);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    val.textContent = next.toFixed(2);
    onChange(next);
  });
  head.append(name, val);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountOrbitControls = (root: HTMLElement, model: OrbitSim, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Orbit';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Gravity Mu', 2, 20, 0.1, p.mu, (v) => {
    model.setParam('mu', v);
    onMutate();
  });
  slider(c, 'Damping', 0, 0.08, 0.001, p.damping, (v) => {
    model.setParam('damping', v);
    onMutate();
  });
  slider(c, 'Initial Radius', 0.4, 2.2, 0.01, p.initialX, (v) => {
    model.setParam('initialX', v);
    model.setParam('initialY', 0);
    const [, , vx, vy] = model.getState();
    model.setState([v, 0, vx, vy]);
    onMutate();
  });
  slider(c, 'Initial Vy', -4, 4, 0.01, p.initialVy, (v) => {
    model.setParam('initialVy', v);
    const [x, y, vx] = model.getState();
    model.setState([x, y, vx, v]);
    onMutate();
  });

  root.append(title, c);
};
