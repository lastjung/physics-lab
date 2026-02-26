import { CollisionLab } from '../simulations/collisionLab';

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

export const mountCollisionLabControls = (root: HTMLElement, model: CollisionLab, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Collision Lab';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Ball Restitution', 0.1, 1, 0.01, p.restitution, (v) => {
    model.setParam('restitution', v);
    onMutate();
  });
  slider(c, 'Wall Restitution', 0.1, 1, 0.01, p.wallRestitution, (v) => {
    model.setParam('wallRestitution', v);
    onMutate();
  });
  slider(c, 'Mass 1', 0.2, 3, 0.01, p.mass1, (v) => {
    model.setParam('mass1', v);
    onMutate();
  });
  slider(c, 'Mass 2', 0.2, 3, 0.01, p.mass2, (v) => {
    model.setParam('mass2', v);
    onMutate();
  });

  root.append(title, c);
};
