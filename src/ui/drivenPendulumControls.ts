import { DrivenPendulum } from '../simulations/drivenPendulum';

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

export const mountDrivenPendulumControls = (root: HTMLElement, model: DrivenPendulum, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Driven Pendulum';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Length', 0.6, 2.4, 0.05, p.length, (v) => { model.setParam('length', v); onMutate(); });
  slider(c, 'Gravity', 1, 20, 0.1, p.gravity, (v) => { model.setParam('gravity', v); onMutate(); });
  slider(c, 'Damping', 0, 0.8, 0.01, p.damping, (v) => { model.setParam('damping', v); onMutate(); });
  slider(c, 'Drive Amp', 0, 2.5, 0.01, p.driveAmplitude, (v) => { model.setParam('driveAmplitude', v); onMutate(); });
  slider(c, 'Drive Freq', 0, 4, 0.01, p.driveFrequency, (v) => { model.setParam('driveFrequency', v); onMutate(); });

  root.append(title, c);
};
