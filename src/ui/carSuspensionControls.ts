import { CarSuspension } from '../simulations/carSuspension';

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

export const mountCarSuspensionControls = (root: HTMLElement, model: CarSuspension, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Car Suspension';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Spring K', 6, 44, 0.1, p.springK, (v) => {
    model.setParam('springK', v);
    onMutate();
  });
  slider(c, 'Damper C', 0, 4, 0.01, p.damperC, (v) => {
    model.setParam('damperC', v);
    onMutate();
  });
  slider(c, 'Tire K', 8, 60, 0.1, p.tireK, (v) => {
    model.setParam('tireK', v);
    onMutate();
  });
  slider(c, 'Road Amp', 0, 0.2, 0.001, p.roadAmplitude, (v) => {
    model.setParam('roadAmplitude', v);
    onMutate();
  });
  slider(c, 'Road Freq', 0.2, 4, 0.01, p.roadFrequency, (v) => {
    model.setParam('roadFrequency', v);
    onMutate();
  });
  slider(c, 'Grip X', -40, 40, 1, p.gripOffsetX, (v) => {
    model.setParam('gripOffsetX', v);
    onMutate();
  });
  slider(c, 'Grip Y', -50, 20, 1, p.gripOffsetY, (v) => {
    model.setParam('gripOffsetY', v);
    onMutate();
  });

  root.append(title, c);
};
