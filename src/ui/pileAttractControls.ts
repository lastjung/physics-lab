import { PileAttract } from '../simulations/pileAttract';

export function mountPileAttractControls(
  root: HTMLElement,
  model: PileAttract,
  onUpdate: () => void
) {
  const params = model.getParams();
  
  const html = `
    <div class="control-group">
      <label>Particle Count: <span id="val-particleCount">${params.particleCount}</span></label>
      <input type="range" id="input-particleCount" min="10" max="200" value="${params.particleCount}" step="5">
    </div>
    <div class="control-group">
      <label>Attract Strength: <span id="val-attractStrength">${params.attractStrength.toFixed(2)}</span></label>
      <input type="range" id="input-attractStrength" min="0.1" max="5.0" value="${params.attractStrength}" step="0.1">
    </div>
    <div class="control-group">
      <label>Damping: <span id="val-damping">${params.damping.toFixed(2)}</span></label>
      <input type="range" id="input-damping" min="0" max="1.0" value="${params.damping}" step="0.01">
    </div>
    <div class="control-group">
      <label>Restitution: <span id="val-restitution">${params.restitution.toFixed(2)}</span></label>
      <input type="range" id="input-restitution" min="0" max="1.0" value="${params.restitution}" step="0.05">
    </div>
    <div class="control-group">
      <label>Boundary: <select id="select-boundary">
        <option value="bounce" ${params.boundaryMode === 'bounce' ? 'selected' : ''}>Bounce</option>
        <option value="wrap" ${params.boundaryMode === 'wrap' ? 'selected' : ''}>Wrap</option>
      </select></label>
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
        if (display) display.textContent = isInt ? val.toString() : val.toFixed(2);
        onUpdate();
    });
  };

  bind('input-particleCount', 'particleCount', true);
  bind('input-attractStrength', 'attractStrength');
  bind('input-damping', 'damping');
  bind('input-restitution', 'restitution');

  root.querySelector('#select-boundary')?.addEventListener('change', (e) => {
    model.setParam('boundaryMode', (e.target as HTMLSelectElement).value as any);
    onUpdate();
  });

  root.querySelector('#btn-reset')?.addEventListener('click', () => {
    model.reset();
    onUpdate();
  });
}
