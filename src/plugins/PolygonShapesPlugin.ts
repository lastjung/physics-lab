import { SimulationRunner } from '../core/simulationRunner';
import { PolygonShapesCanvasRenderer } from '../render/polygonShapesCanvasRenderer';
import { PolygonShapes } from '../simulations/polygonShapes';
import { mountPolygonShapesControls } from '../ui/polygonShapesControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const polygonShapesPlugin: SimulationPlugin = {
  id: 'polygon-shapes',
  create(context: PluginContext): ActivePlugin {
    const defaults = PolygonShapes.getDefaultParams();
    const model = new PolygonShapes({
      ...defaults,
      ...context.presetValues,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      angularDamping:
        readValue(context.initialValues, 'angularDamping', 'ad') ??
        readValue(context.presetValues, 'angularDamping') ??
        defaults.angularDamping,
      restitution:
        readValue(context.initialValues, 'restitution', 'e') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      wallRestitution:
        readValue(context.initialValues, 'wallRestitution', 'we') ??
        readValue(context.presetValues, 'wallRestitution') ??
        defaults.wallRestitution,
      friction: readValue(context.initialValues, 'friction', 'mu') ?? readValue(context.presetValues, 'friction') ?? defaults.friction,
    });

    const renderer = new PolygonShapesCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const b = renderer.getWorldBounds();
      const impact = model.resolveCollisions(b.minX, b.maxX, b.minY, b.maxY);
      if (impact > 0.08) {
        const now = performance.now();
        if (now - lastImpactAt > 42) {
          context.onSfx('step', Math.min(1.6, impact));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | polys=${k.count} | vmax=${k.maxSpeed.toFixed(2)}`,
        `E=${k.kinetic.toFixed(2)} | e=${model.getParams().restitution.toFixed(2)} | μ=${model.getParams().friction.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        gravity: p.gravity,
        damping: p.damping,
        angularDamping: p.angularDamping,
        restitution: p.restitution,
        wallRestitution: p.wallRestitution,
        friction: p.friction,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountPolygonShapesControls(context.menuRoot, model, redraw);

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
