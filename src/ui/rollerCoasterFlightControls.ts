import { RollerCoasterFlight } from '../simulations/rollerCoasterFlight';

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

export const mountRollerCoasterFlightControls = (root: HTMLElement, model: RollerCoasterFlight, onMutate: () => void): void => {
  root.innerHTML = '';
  const p = model.getParams();
  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Coaster + Flight';

  const controls = document.createElement('div');
  controls.className = 'controls';

  slider(controls, 'Gravity', 1, 20, 0.1, p.gravity, (v) => { model.setParam('gravity', v); onMutate(); });
  slider(controls, 'Damping', 0, 0.3, 0.001, p.damping, (v) => { model.setParam('damping', v); onMutate(); });
  slider(controls, 'Track Amp', 0.1, 1, 0.01, p.trackAmplitude, (v) => { model.setParam('trackAmplitude', v); onMutate(); });
  slider(controls, 'Track Freq', 0.6, 3.0, 0.01, p.trackFrequency, (v) => { model.setParam('trackFrequency', v); onMutate(); });
  slider(controls, 'Track Tilt', -0.4, 0.4, 0.01, p.trackTilt, (v) => { model.setParam('trackTilt', v); onMutate(); });
  slider(controls, 'Flight Threshold', -4, 2, 0.05, p.flightThreshold, (v) => { model.setParam('flightThreshold', v); onMutate(); });
  slider(controls, 'Wall Bounce', 0.2, 1, 0.01, p.boundaryRestitution, (v) => { model.setParam('boundaryRestitution', v); onMutate(); });

  root.append(title, controls);
};
