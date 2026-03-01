import { WheelJointDemo } from '../simulations/wheelJointDemo';

const createSlider = (container: HTMLElement, label: string, id: string, min: number, max: number, step: number, value: number, onUpdate: (v: number) => void) => {
  const wrap = document.createElement('label');
  const head = document.createElement('div');
  head.className = 'control-head';
  
  const name = document.createElement('span');
  name.textContent = label;
  
  const valDisplay = document.createElement('span');
  valDisplay.className = 'control-value';
  valDisplay.id = `v_${id}`;
  valDisplay.textContent = value.toFixed(1);
  
  head.append(name, valDisplay);
  
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  
  input.addEventListener('input', () => {
    const v = Number(input.value);
    valDisplay.textContent = v.toFixed(1);
    onUpdate(v);
  });
  
  wrap.append(head, input);
  container.append(wrap);
};

const createCheckbox = (container: HTMLElement, label: string, id: string, checked: boolean, onUpdate: (v: boolean) => void) => {
  const wrap = document.createElement('label');
  wrap.className = 'option-row';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  input.addEventListener('change', () => onUpdate(input.checked));
  
  const span = document.createElement('span');
  span.textContent = label;
  
  wrap.append(input, span);
  container.append(wrap);
};

export function mountWheelJointDemoControls(
  root: HTMLElement,
  model: WheelJointDemo,
  onUpdate: () => void
) {
  root.innerHTML = '';
  const p = model.getParams();

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Wheel Joint Demo (Car)';
  
  const controls = document.createElement('div');
  controls.className = 'controls';

  createSlider(controls, 'Suspension Stiffness', 'stiffness', 0, 500, 10, p.stiffness, (v) => {
    model.setParam('stiffness', v);
    onUpdate();
  });

  createSlider(controls, 'Suspension Damping', 'damping', 0, 50, 1, p.damping, (v) => {
    model.setParam('damping', v);
    onUpdate();
  });

  const hr = document.createElement('hr');
  hr.style.border = '0';
  hr.style.borderTop = '1px solid var(--panel-border)';
  hr.style.margin = '8px 0';
  controls.append(hr);

  createCheckbox(controls, 'Motor Enabled', 'motorEnabled', p.motorEnabled, (v) => {
    model.setParam('motorEnabled', v);
    onUpdate();
  });

  createSlider(controls, 'Motor Speed', 'motorSpeed', -20, 20, 1, p.motorSpeed, (v) => {
    model.setParam('motorSpeed', v);
    onUpdate();
  });

  createSlider(controls, 'Max Torque', 'maxTorque', 0, 200, 5, p.maxMotorTorque, (v) => {
    model.setParam('maxMotorTorque', v);
    onUpdate();
  });

  const hr2 = document.createElement('hr');
  hr2.style.border = '0';
  hr2.style.borderTop = '1px solid var(--panel-border)';
  hr2.style.margin = '8px 0';
  controls.append(hr2);

  createSlider(controls, 'Gravity', 'gravity', 0, 30, 0.5, p.gravity, (v) => {
    model.setParam('gravity', v);
    onUpdate();
  });

  createSlider(controls, 'Sub-stepping', 'subSteps', 1, 10, 1, p.subSteps, (v) => {
    model.setParam('subSteps', Math.floor(v));
    onUpdate();
  });

  root.append(title, controls);

  return {
    updateStats: () => {
      // Could add stats like compression or speed
    },
    refresh: () => {
      // Sync UI if needed
    }
  };
}
