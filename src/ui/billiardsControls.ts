import { Billiards } from '../simulations/billiards';

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

export const mountBilliardsControls = (root: HTMLElement, model: Billiards, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Billiards';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Ball Restitution', 0.5, 1, 0.01, p.restitution, (v) => {
    model.setParam('restitution', v);
    onMutate();
  });
  slider(c, 'Wall Restitution', 0.5, 1, 0.01, p.wallRestitution, (v) => {
    model.setParam('wallRestitution', v);
    onMutate();
  });
  slider(c, 'Damping', 0, 0.08, 0.001, p.linearDamping, (v) => {
    model.setParam('linearDamping', v);
    onMutate();
  });
  slider(c, 'Cue Speed', 0, 5.5, 0.01, p.cueSpeed, (v) => {
    model.setParam('cueSpeed', v);
    const s = model.getState();
    model.setBallState(0, s[0], s[1], v, s[3]);
    onMutate();
  });

  root.append(title, c);
};
