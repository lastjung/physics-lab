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
  const refresh = () => mountRollerCoasterControls(root, model, onMutate);
  const isClose = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

  const optionRow = document.createElement('div');
  optionRow.className = 'option-row';
  const presetButton = (label: string, amplitude: number, frequency: number, tilt: number, damping: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    const active =
      isClose(p.trackAmplitude, amplitude, 0.005) &&
      isClose(p.trackFrequency, frequency, 0.005) &&
      isClose(p.trackTilt, tilt, 0.005) &&
      isClose(p.damping, damping, 0.005);
    b.className = active ? '' : 'secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      model.setParam('trackAmplitude', amplitude);
      model.setParam('trackFrequency', frequency);
      model.setParam('trackTilt', tilt);
      model.setParam('damping', damping);
      onMutate();
      refresh();
    });
    return b;
  };
  optionRow.append(
    presetButton('Balanced', 0.55, 1.35, 0.05, 0.04),
    presetButton('Steep', 0.72, 1.55, 0.08, 0.08),
    presetButton('Long Wave', 0.42, 0.86, 0.03, 0.03),
  );

  const boundaryRow = document.createElement('div');
  boundaryRow.className = 'option-row';
  const modeButton = (label: string, mode: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = p.boundaryMode === mode ? '' : 'secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      model.setParam('boundaryMode', mode);
      onMutate();
      refresh();
    });
    return b;
  };
  boundaryRow.append(modeButton('Bounce', 0), modeButton('Wrap', 1));

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

  root.append(title, optionRow, boundaryRow, c);
};
