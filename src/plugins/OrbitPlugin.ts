import { SimulationRunner } from '../core/simulationRunner';
import { OrbitCanvasRenderer } from '../render/orbitCanvasRenderer';
import { OrbitSim } from '../simulations/orbit';
import { mountOrbitControls } from '../ui/orbitControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const orbitPlugin: SimulationPlugin = {
  id: 'orbit',
  create(context: PluginContext): ActivePlugin {
    const defaults = OrbitSim.getDefaultParams();
    const model = new OrbitSim({
      ...defaults,
      ...context.presetValues,
      mu: readValue(context.initialValues, 'mu') ?? readValue(context.presetValues, 'mu') ?? defaults.mu,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      initialX: readValue(context.initialValues, 'initialX', 'ix') ?? readValue(context.presetValues, 'initialX') ?? defaults.initialX,
      initialY: readValue(context.initialValues, 'initialY', 'iy') ?? readValue(context.presetValues, 'initialY') ?? defaults.initialY,
      initialVx: readValue(context.initialValues, 'initialVx', 'ivx') ?? readValue(context.presetValues, 'initialVx') ?? defaults.initialVx,
      initialVy: readValue(context.initialValues, 'initialVy', 'ivy') ?? readValue(context.presetValues, 'initialVy') ?? defaults.initialVy,
    });

    const x = readValue(context.initialValues, 'x');
    const y = readValue(context.initialValues, 'y');
    const vx = readValue(context.initialValues, 'vx');
    const vy = readValue(context.initialValues, 'vy');
    if (x != null && y != null && vx != null && vy != null) {
      model.setState([x, y, vx, vy]);
      model.setParam('initialX', x);
      model.setParam('initialY', y);
      model.setParam('initialVx', vx);
      model.setParam('initialVy', vy);
    }

    const renderer = new OrbitCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x=${k.x.toFixed(2)} | y=${k.y.toFixed(2)}`,
        `vx=${k.vx.toFixed(2)} | vy=${k.vy.toFixed(2)} | r=${k.r.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        mu: p.mu,
        damping: p.damping,
        initialX: p.initialX,
        initialY: p.initialY,
        initialVx: p.initialVx,
        initialVy: p.initialVy,
        x: k.x,
        y: k.y,
        vx: k.vx,
        vy: k.vy,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountOrbitControls(context.menuRoot, model, redraw);

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => runner.reset(),
      step: (count = 1) => runner.step(count),
      destroy: () => {
        runner.stop();
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
