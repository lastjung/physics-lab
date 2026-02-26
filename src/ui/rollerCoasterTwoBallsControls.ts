import { RollerCoasterTwoBalls } from '../simulations/rollerCoasterTwoBalls';

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

export const mountRollerCoasterTwoBallsControls = (root: HTMLElement, model: RollerCoasterTwoBalls, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Coaster Two Balls';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();
  const lengthRow = document.createElement('div');
  lengthRow.className = 'option-row';
  const isClose = (a: number, b: number, eps = 0.05) => Math.abs(a - b) <= eps;
  const lengthButton = (label: string, frequency: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = isClose(p.trackFrequency, frequency) ? '' : 'secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      model.setParam('trackFrequency', frequency);
      onMutate();
      mountRollerCoasterTwoBallsControls(root, model, onMutate);
    });
    return b;
  };
  lengthRow.append(lengthButton('Short', 1.9), lengthButton('Medium', 1.35), lengthButton('Long', 0.85));

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
  slider(c, 'Ball Restitution', 0.5, 1, 0.01, p.ballRestitution, (v) => {
    model.setParam('ballRestitution', v);
    onMutate();
  });

  root.append(title, lengthRow, c);
};
