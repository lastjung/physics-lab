import { RollerCoaster } from '../simulations/rollerCoaster';

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

export const mountRollerCoasterControls = (root: HTMLElement, model: RollerCoaster, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Roller Coaster';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Gravity', 1, 20, 0.1, p.gravity, (v) => {
    model.setParam('gravity', v);
    onMutate();
  });
  slider(c, 'Damping', 0, 0.3, 0.001, p.damping, (v) => {
    model.setParam('damping', v);
    onMutate();
  });
  slider(c, 'Track Amp', 0.1, 1, 0.01, p.trackAmplitude, (v) => {
    model.setParam('trackAmplitude', v);
    onMutate();
  });
  slider(c, 'Track Freq', 0.5, 2.8, 0.01, p.trackFrequency, (v) => {
    model.setParam('trackFrequency', v);
    onMutate();
  });
  slider(c, 'Track Tilt', -0.4, 0.4, 0.01, p.trackTilt, (v) => {
    model.setParam('trackTilt', v);
    onMutate();
  });
  slider(c, 'Wall Bounce', 0.2, 1, 0.01, p.boundaryRestitution, (v) => {
    model.setParam('boundaryRestitution', v);
    onMutate();
  });

  root.append(title, c);
};
