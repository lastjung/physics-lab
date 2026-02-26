import { CoupledSpring } from '../simulations/coupledSpring';

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

export const mountCoupledSpringControls = (root: HTMLElement, model: CoupledSpring, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Coupled Spring';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'k1', 2, 30, 0.2, p.k1, (v) => { model.setParam('k1', v); onMutate(); });
  slider(c, 'k2', 2, 30, 0.2, p.k2, (v) => { model.setParam('k2', v); onMutate(); });
  slider(c, 'Damping', 0, 1.2, 0.01, p.damping, (v) => { model.setParam('damping', v); onMutate(); });
  slider(c, 'x1', -0.9, 0.9, 0.01, p.initialX1, (v) => {
    const [, x2] = model.getState();
    model.setState([v, x2, 0, 0]);
    model.setParam('initialX1', v);
    onMutate();
  });
  slider(c, 'x2', -0.9, 0.9, 0.01, p.initialX2, (v) => {
    const [x1] = model.getState();
    model.setState([x1, v, 0, 0]);
    model.setParam('initialX2', v);
    onMutate();
  });

  root.append(title, c);
};
