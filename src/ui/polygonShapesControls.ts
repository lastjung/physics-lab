import { PolygonShapes } from '../simulations/polygonShapes';

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
    const v = Number(input.value);
    val.textContent = v.toFixed(2);
    onChange(v);
  });
  head.append(name, val);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountPolygonShapesControls = (root: HTMLElement, model: PolygonShapes, onMutate: () => void): void => {
  root.innerHTML = '';
  const p = model.getParams();

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Polygon Shapes';

  const row = document.createElement('div');
  row.className = 'option-row';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset Stack';
  resetBtn.addEventListener('click', () => {
    model.reset();
    onMutate();
  });
  row.append(resetBtn);

  const controls = document.createElement('div');
  controls.className = 'controls';
  slider(controls, 'Gravity', 0, 20, 0.1, p.gravity, (v) => { model.setParam('gravity', v); onMutate(); });
  slider(controls, 'Linear Damping', 0, 0.2, 0.001, p.damping, (v) => { model.setParam('damping', v); onMutate(); });
  slider(controls, 'Angular Damping', 0, 0.2, 0.001, p.angularDamping, (v) => { model.setParam('angularDamping', v); onMutate(); });
  slider(controls, 'Polygon Restitution', 0.1, 1, 0.01, p.restitution, (v) => { model.setParam('restitution', v); onMutate(); });
  slider(controls, 'Wall Bounce', 0.1, 1, 0.01, p.wallRestitution, (v) => { model.setParam('wallRestitution', v); onMutate(); });
  slider(controls, 'Friction', 0, 1, 0.01, p.friction, (v) => { model.setParam('friction', v); onMutate(); });

  root.append(title, row, controls);
};
