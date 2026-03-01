import { RevoluteDemo } from '../simulations/revoluteDemo';

const createSlider = (container: HTMLElement, label: string, id: string, min: number, max: number, step: number, value: number, onUpdate: (v: number) => void, isAngle = false) => {
  const wrap = document.createElement('label');
  const head = document.createElement('div');
  head.className = 'control-head';
  
  const name = document.createElement('span');
  name.textContent = label;
  
  const valDisplay = document.createElement('span');
  valDisplay.className = 'control-value';
  valDisplay.id = `v_${id}`;
  valDisplay.textContent = isAngle ? `${value.toFixed(0)}°` : value.toFixed(1);
  
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
    valDisplay.textContent = isAngle ? `${v}°` : v.toFixed(1);
    onUpdate(isAngle ? v * Math.PI / 180 : v);
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

export function mountRevoluteDemoControls(
  root: HTMLElement,
  model: RevoluteDemo,
  onUpdate: () => void
) {
  root.innerHTML = '';
  const p = model.getParams();

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Revolute Joint Demo';
  
  const controls = document.createElement('div');
  controls.className = 'controls';

  createCheckbox(controls, 'Motor Enabled', 'motorEnabled', p.motorEnabled, (v) => {
    model.setParam('motorEnabled', v);
    onUpdate();
  });

  createSlider(controls, 'Motor Speed', 'motorSpeed', -10, 10, 0.5, p.motorSpeed, (v) => {
    model.setParam('motorSpeed', v);
    onUpdate();
  });

  createSlider(controls, 'Max Torque', 'maxTorque', 0, 300, 1, p.maxMotorTorque, (v) => {
    model.setParam('maxMotorTorque', v);
    onUpdate();
  });

  const hr = document.createElement('hr');
  hr.style.border = '0';
  hr.style.borderTop = '1px solid var(--panel-border)';
  hr.style.margin = '8px 0';
  controls.append(hr);

  createCheckbox(controls, 'Limits Enabled', 'limitEnabled', p.limitEnabled, (v) => {
    model.setParam('limitEnabled', v);
    onUpdate();
  });

  createSlider(controls, 'Lower Angle', 'lowerAngle', -180, 180, 1, p.lowerAngle * 180 / Math.PI, (v) => {
    model.setParam('lowerAngle', v);
    onUpdate();
  }, true);

  createSlider(controls, 'Upper Angle', 'upperAngle', -180, 180, 1, p.upperAngle * 180 / Math.PI, (v) => {
    model.setParam('upperAngle', v);
    onUpdate();
  }, true);

  const hr2 = document.createElement('hr');
  hr2.style.border = '0';
  hr2.style.borderTop = '1px solid var(--panel-border)';
  hr2.style.margin = '8px 0';
  controls.append(hr2);

  createSlider(controls, 'Arm Length', 'armLength', 0.1, 0.8, 0.05, p.armLength, (v) => {
    model.setParam('armLength', v);
    onUpdate();
  });

  createSlider(controls, 'Gravity', 'gravity', 0, 50, 0.1, p.gravity, (v) => {
    model.setParam('gravity', v);
    onUpdate();
  });

  const stats = document.createElement('div');
  stats.className = 'stats';
  stats.id = 'stat-angle';
  stats.style.marginTop = '10px';
  stats.textContent = 'Current Angle: 0.00 rad';
  controls.append(stats);

  root.append(title, controls);

  return {
    updateStats: () => {
      const s = model.getJointState();
      const el = root.querySelector('#stat-angle') as HTMLElement;
      if (el) {
        el.innerText = `Current Angle: ${s.angle.toFixed(2)} rad (${(s.angle * 180 / Math.PI).toFixed(1)}°)`;
      }
    },
    refresh: () => {
      const np = model.getParams();
      const fields = [
        { id: 'motorEnabled', type: 'checkbox', value: np.motorEnabled },
        { id: 'motorSpeed', type: 'range', value: np.motorSpeed },
        { id: 'maxTorque', type: 'range', value: np.maxMotorTorque },
        { id: 'limitEnabled', type: 'checkbox', value: np.limitEnabled },
        { id: 'lowerAngle', type: 'range', value: np.lowerAngle * 180 / Math.PI, isAngle: true },
        { id: 'upperAngle', type: 'range', value: np.upperAngle * 180 / Math.PI, isAngle: true },
        { id: 'armLength', type: 'range', value: np.armLength },
        { id: 'gravity', type: 'range', value: np.gravity }
      ];

      fields.forEach(f => {
        const input = root.querySelector(`#${f.id}`) as HTMLInputElement;
        if (input) {
          if (f.type === 'checkbox') input.checked = f.value as boolean;
          else {
            input.value = String(f.value);
            const valDisplay = root.querySelector(`#v_${f.id}`) as HTMLElement;
            if (valDisplay) {
              valDisplay.textContent = f.isAngle ? `${(f.value as number).toFixed(0)}°` : (f.value as number).toFixed(1);
            }
          }
        }
      });
    }
  };
}
