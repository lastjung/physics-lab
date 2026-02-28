import { DoublePendulumCompare } from '../simulations/doublePendulumCompare';

export function mountDoublePendulumCompareControls(
  root: HTMLElement,
  model: DoublePendulumCompare,
  onUpdate: () => void,
  toggleTrails: (show: boolean) => void
) {
  const params = model.getParams();
  
  const html = `
    <div class="control-group">
        <label>Epsilon (Initial Offset): <span id="val-epsilon">${params.epsilon.toExponential(1)}</span></label>
        <input type="range" id="input-epsilon" min="-10" max="-1" value="${Math.log10(params.epsilon)}" step="1">
    </div>
    <div class="control-group">
      <label>Length 1: <span id="val-l1">${params.l1.toFixed(2)}</span></label>
      <input type="range" id="input-l1" min="0.5" max="2.0" value="${params.l1}" step="0.05">
    </div>
    <div class="control-group">
      <label>Length 2: <span id="val-l2">${params.l2.toFixed(2)}</span></label>
      <input type="range" id="input-l2" min="0.5" max="2.0" value="${params.l2}" step="0.05">
    </div>
    <div class="control-group">
        <label>Damping: <span id="val-damping">${params.damping.toFixed(3)}</span></label>
        <input type="range" id="input-damping" min="0" max="0.2" value="${params.damping}" step="0.005">
    </div>
    <div class="control-group">
      <label>Initial Theta 1: <span id="val-initialTheta1">${params.initialTheta1.toFixed(2)}</span></label>
      <input type="range" id="input-initialTheta1" min="-3.14" max="3.14" value="${params.initialTheta1}" step="0.05">
    </div>
    <div class="control-group">
        <label><input type="checkbox" id="check-trails" checked> Show Trails</label>
    </div>
    <button id="btn-reset" class="reset-button">Sync Reset (Reset Time)</button>
  `;

  root.innerHTML = html;

  const bind = (id: string, key: string, isInt = false, isLog = false) => {
    const input = root.querySelector(`#${id}`) as HTMLInputElement;
    const display = root.querySelector(`#val-${key}`) as HTMLElement;
    input.addEventListener('input', () => {
        let val = parseFloat(input.value);
        if (isLog) {
            val = Math.pow(10, val);
            display.textContent = val.toExponential(1);
        } else {
            display.textContent = isInt ? val.toString() : val.toFixed(2);
        }
        model.setParam(key as any, val);
        onUpdate();
    });
  };

  bind('input-epsilon', 'epsilon', false, true);
  bind('input-l1', 'l1');
  bind('input-l2', 'l2');
  bind('input-damping', 'damping');
  bind('input-initialTheta1', 'initialTheta1');

  root.querySelector('#check-trails')?.addEventListener('change', (e) => {
    toggleTrails((e.target as HTMLInputElement).checked);
    onUpdate();
  });

  root.querySelector('#btn-reset')?.addEventListener('click', () => {
    model.reset();
    onUpdate();
  });
}
