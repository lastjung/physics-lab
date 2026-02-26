import { CartPendulum } from '../simulations/cartPendulum';

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

export const mountCartPendulumControls = (root: HTMLElement, model: CartPendulum, onMutate: () => void): void => {
  root.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Cart + Pendulum';
  const c = document.createElement('div');
  c.className = 'controls';
  const p = model.getParams();

  slider(c, 'Cart Mass', 0.4, 4, 0.01, p.cartMass, (v) => {
    model.setParam('cartMass', v);
    onMutate();
  });
  slider(c, 'Bob Mass', 0.1, 2, 0.01, p.bobMass, (v) => {
    model.setParam('bobMass', v);
    onMutate();
  });
  slider(c, 'Length', 0.4, 1.4, 0.01, p.length, (v) => {
    model.setParam('length', v);
    onMutate();
  });
  slider(c, 'Cart Spring', 0, 8, 0.01, p.cartSpring, (v) => {
    model.setParam('cartSpring', v);
    onMutate();
  });
  slider(c, 'Cart Damping', 0, 1.2, 0.01, p.cartDamping, (v) => {
    model.setParam('cartDamping', v);
    onMutate();
  });
  slider(c, 'Pendulum Damping', 0, 0.3, 0.001, p.pendulumDamping, (v) => {
    model.setParam('pendulumDamping', v);
    onMutate();
  });
  slider(c, 'Drive Amp', 0, 12, 0.01, p.driveAmplitude, (v) => {
    model.setParam('driveAmplitude', v);
    onMutate();
  });
  slider(c, 'Drive Freq', 0.2, 4, 0.01, p.driveFrequency, (v) => {
    model.setParam('driveFrequency', v);
    onMutate();
  });

  root.append(title, c);
};
