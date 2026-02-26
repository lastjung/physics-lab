import { NewtonsCradle } from '../simulations/newtonsCradle';

const slider = (root: HTMLElement, label: string, min: number, max: number, step: number, value: number, onChange: (v: number) => void) => {
  const wrap = document.createElement('label');
  const head = document.createElement('div');
  head.className = 'control-head';
  const name = document.createElement('span');
  name.textContent = label;
  const val = document.createElement('span');
  val.className = 'control-value';
  val.textContent = value.toFixed(2);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    val.textContent = next.toFixed(2);
    onChange(next);
  });
  head.append(name, val);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountNewtonsCradleControls = (root: HTMLElement, model: NewtonsCradle, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = "Newton's Cradle";
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Stiffness', 6, 28, 0.1, p.stiffness, (v) => {
    model.setParam('stiffness', v);
    onMutate();
  });
  slider(c, 'Damping', 0, 0.2, 0.001, p.damping, (v) => {
    model.setParam('damping', v);
    onMutate();
  });
  slider(c, 'Restitution', 0.8, 1, 0.001, p.restitution, (v) => {
    model.setParam('restitution', v);
    onMutate();
  });
  slider(c, 'Spacing', 0.235, 0.32, 0.001, p.spacing, (v) => {
    model.setParam('spacing', v);
    onMutate();
  });
  slider(c, 'Initial X1', -0.62, 0.15, 0.01, p.initialX1, (v) => {
    model.setParam('initialX1', v);
    model.setBallState(0, v, model.getState()[5]);
    onMutate();
  });
  slider(c, 'Initial X5', -0.15, 0.62, 0.01, p.initialX5, (v) => {
    model.setParam('initialX5', v);
    model.setBallState(4, v, model.getState()[9]);
    onMutate();
  });

  root.append(title, c);
};
