import { SimulationRunner } from '../core/simulationRunner';
import { SpringCanvasRenderer } from '../render/springCanvasRenderer';
import { SpringMass } from '../simulations/springMass';
import { mountSpringControls } from '../ui/springControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const springMassPlugin: SimulationPlugin = {
  id: 'spring-mass',
  create(context: PluginContext): ActivePlugin {
    const defaults = SpringMass.getDefaultParams();
    const model = new SpringMass({
      ...defaults,
      ...context.presetValues,
      mass: readValue(context.initialValues, 'mass') ?? readValue(context.presetValues, 'mass') ?? defaults.mass,
      stiffness:
        readValue(context.initialValues, 'stiffness', 'k') ??
        readValue(context.presetValues, 'stiffness') ??
        defaults.stiffness,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      initialDisplacement:
        readValue(context.initialValues, 'initialDisplacement', 'ix') ??
        readValue(context.presetValues, 'initialDisplacement') ??
        defaults.initialDisplacement,
      initialVelocity:
        readValue(context.initialValues, 'initialVelocity', 'iv') ??
        readValue(context.presetValues, 'initialVelocity') ??
        defaults.initialVelocity,
    });

    const x = readValue(context.initialValues, 'x');
    const v = readValue(context.initialValues, 'v');
    if (x != null && v != null) {
      model.setState([x, v]);
      model.setParam('initialDisplacement', x);
      model.setParam('initialVelocity', v);
    }

    const renderer = new SpringCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onStats(`t=${model.getTime().toFixed(2)}s | x=${k.x.toFixed(3)} m | v=${k.v.toFixed(3)} m/s | E=${k.total.toFixed(3)} J`);
      const p = model.getParams();
      context.onStateChange({
        mass: p.mass,
        stiffness: p.stiffness,
        damping: p.damping,
        initialDisplacement: p.initialDisplacement,
        initialVelocity: p.initialVelocity,
        x: k.x,
        v: k.v,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountSpringControls(context.menuRoot, model, redraw);

    const disposers: Array<() => void> = [];
    const on = (target: HTMLCanvasElement, type: string, handler: (event: PointerEvent) => void) => {
      const listener = handler as unknown as EventListener;
      target.addEventListener(type, listener);
      disposers.push(() => target.removeEventListener(type, listener));
    };

    const toCanvasPoint = (event: PointerEvent) => {
      const rect = context.canvas.getBoundingClientRect();
      const scaleX = context.canvas.width / rect.width;
      return {
        x: (event.clientX - rect.left) * scaleX,
      };
    };

    const applyPointerX = (event: PointerEvent) => {
      const point = toCanvasPoint(event);
      const nextX = renderer.xFromPointer(point.x);
      const clamped = Math.max(-1, Math.min(1, nextX));
      model.setState([clamped, 0]);
      model.setParam('initialDisplacement', clamped);
      model.setParam('initialVelocity', 0);
      redraw();
    };

    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const point = toCanvasPoint(event);
      const block = renderer.getBlockPixelPosition();
      const hit = Math.abs(point.x - block.x) < 90;
      if (!hit) return;

      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      applyPointerX(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      applyPointerX(event);
    });

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
      resumeAfterDrag = false;
    };

    on(context.canvas, 'pointerup', endDrag);
    on(context.canvas, 'pointercancel', endDrag);

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => runner.reset(),
      step: (count = 1) => runner.step(count),
      destroy: () => {
        runner.stop();
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
