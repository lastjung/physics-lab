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
  slider(c, 'Air Damping', 0, 0.06, 0.001, p.linearDamping, (v) => {
    model.setParam('linearDamping', v);
    onMutate();
  });

  const applyVelocity = (index: 1 | 2, axis: 'x' | 'y', value: number) => {
    const s = model.getState();
    if (index === 1) {
      const x = s[0];
      const y = s[1];
      const vx = axis === 'x' ? value : s[2];
      const vy = axis === 'y' ? value : s[3];
      model.setBodyState(1, x, y, vx, vy);
      model.setParam(axis === 'x' ? 'initialVx1' : 'initialVy1', value);
      return;
    }

    const x = s[4];
    const y = s[5];
    const vx = axis === 'x' ? value : s[6];
    const vy = axis === 'y' ? value : s[7];
    model.setBodyState(2, x, y, vx, vy);
    model.setParam(axis === 'x' ? 'initialVx2' : 'initialVy2', value);
  };

  slider(c, 'Initial Vx1', -3, 3, 0.01, p.initialVx1, (v) => {
    applyVelocity(1, 'x', v);
    onMutate();
  });

  slider(c, 'Initial Vy1', -3, 3, 0.01, p.initialVy1, (v) => {
    applyVelocity(1, 'y', v);
    onMutate();
  });

  slider(c, 'Initial Vx2', -3, 3, 0.01, p.initialVx2, (v) => {
    applyVelocity(2, 'x', v);
    onMutate();
  });

  slider(c, 'Initial Vy2', -3, 3, 0.01, p.initialVy2, (v) => {
    applyVelocity(2, 'y', v);
    onMutate();
  });

  root.append(title, c);
};
