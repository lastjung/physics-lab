import { CollidingBlocks } from '../simulations/collidingBlocks';

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
    const v = Number(input.value);
    val.textContent = v.toFixed(2);
    onChange(v);
  });
  head.append(name, val);
  wrap.append(head, input);
  root.append(wrap);
};

export const mountCollidingBlocksControls = (
  root: HTMLElement,
  model: CollidingBlocks,
  onMutate: () => void,
  onShuffle: (strength: number) => void,
  onRebuild: (rows: number, cols: number) => void,
): void => {
  root.innerHTML = '';
  const p = model.getParams();

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Colliding Blocks';

  const modeRow = document.createElement('div');
  modeRow.className = 'option-row';
  const configButton = (label: string, rows: number, cols: number, kick: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = p.rows === rows && p.cols === cols ? '' : 'secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      onRebuild(rows, cols);
      onShuffle(kick);
      onMutate();
      mountCollidingBlocksControls(root, model, onMutate, onShuffle, onRebuild);
    });
    return b;
  };
  modeRow.append(
    configButton('Stack 3x4', 3, 4, 1.2),
    configButton('Dense 4x5', 4, 5, 1.6),
    configButton('Sparse 2x6', 2, 6, 2.0),
  );

  const shuffleRow = document.createElement('div');
  shuffleRow.className = 'option-row';
  const shuffleButton = (label: string, kick: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      onShuffle(kick);
      onMutate();
    });
    return b;
  };
  shuffleRow.append(shuffleButton('Shake Soft', 0.9), shuffleButton('Shake Hard', 2.2));

  const controls = document.createElement('div');
  controls.className = 'controls';
  slider(controls, 'Gravity', 0, 20, 0.1, p.gravity, (v) => {
    model.setParam('gravity', v);
    onMutate();
  });
  slider(controls, 'Damping', 0, 0.2, 0.001, p.damping, (v) => {
    model.setParam('damping', v);
    onMutate();
  });
  slider(controls, 'Block Restitution', 0.1, 1, 0.01, p.restitution, (v) => {
    model.setParam('restitution', v);
    onMutate();
  });
  slider(controls, 'Wall Bounce', 0.1, 1, 0.01, p.wallRestitution, (v) => {
    model.setParam('wallRestitution', v);
    onMutate();
  });

  root.append(title, modeRow, shuffleRow, controls);
};
