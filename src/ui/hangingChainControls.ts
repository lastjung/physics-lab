import { HangingChain } from '../simulations/hangingChain';

export function mountHangingChainControls(
  root: HTMLElement,
  model: HangingChain,
  onUpdate: () => void
) {
  const params = model.getParams();
  
  const html = `
    <div class="control-group">
      <label>Segments: <span id="val-segments">${params.segments}</span></label>
      <input type="range" id="input-segments" min="2" max="30" value="${params.segments}" step="1">
    </div>
    <div class="control-group">
      <label>Link Length: <span id="val-linkLength">${params.linkLength.toFixed(2)}</span></label>
      <input type="range" id="input-linkLength" min="0.05" max="0.5" value="${params.linkLength}" step="0.01">
    </div>
    <div class="control-group">
      <label>Stiffness (Beta): <span id="val-stiffness">${params.stiffness.toFixed(2)}</span></label>
      <input type="range" id="input-stiffness" min="0.01" max="1.0" value="${params.stiffness}" step="0.01">
    </div>
    <div class="control-group">
      <label>Gravity: <span id="val-gravity">${params.gravity.toFixed(1)}</span></label>
      <input type="range" id="input-gravity" min="0" max="20" value="${params.gravity}" step="0.5">
    </div>
    <div class="control-group">
      <label>Iterations: <span id="val-iterations">${params.iterations}</span></label>
      <input type="range" id="input-iterations" min="1" max="50" value="${params.iterations}" step="1">
    </div>
    <button id="btn-reset" class="reset-button">Reset Simulation</button>
  `;

  root.innerHTML = html;

  const bind = (id: string, key: string, isInt = false) => {
    const input = root.querySelector(`#${id}`) as HTMLInputElement;
    const display = root.querySelector(`#val-${key}`) as HTMLElement;
    input.addEventListener('input', () => {
        const val = isInt ? parseInt(input.value) : parseFloat(input.value);
        model.setParam(key as any, val);
        display.textContent = isInt ? val.toString() : val.toFixed(2);
        onUpdate();
    });
  };

  bind('input-segments', 'segments', true);
  bind('input-linkLength', 'linkLength');
  bind('input-stiffness', 'stiffness');
  bind('input-gravity', 'gravity');
  bind('input-iterations', 'iterations', true);

  root.querySelector('#btn-reset')?.addEventListener('click', () => {
    model.reset();
    onUpdate();
  });
}
