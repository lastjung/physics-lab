import { SimulationRunner } from '../core/simulationRunner';
import { RollerCoasterCanvasRenderer } from '../render/rollerCoasterCanvasRenderer';
import { RollerCoaster } from '../simulations/rollerCoaster';
import { mountRollerCoasterControls } from '../ui/rollerCoasterControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const rollerCoasterPlugin: SimulationPlugin = {
  id: 'roller-coaster',
  create(context: PluginContext): ActivePlugin {
    const defaults = RollerCoaster.getDefaultParams();
    const model = new RollerCoaster({
      ...defaults,
      ...context.presetValues,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      trackAmplitude:
        readValue(context.initialValues, 'trackAmplitude', 'ta') ?? readValue(context.presetValues, 'trackAmplitude') ?? defaults.trackAmplitude,
      trackFrequency:
        readValue(context.initialValues, 'trackFrequency', 'tf') ?? readValue(context.presetValues, 'trackFrequency') ?? defaults.trackFrequency,
      trackTilt: readValue(context.initialValues, 'trackTilt', 'tt') ?? readValue(context.presetValues, 'trackTilt') ?? defaults.trackTilt,
      boundaryRestitution:
        readValue(context.initialValues, 'boundaryRestitution', 'be') ??
        readValue(context.presetValues, 'boundaryRestitution') ??
        defaults.boundaryRestitution,
      initialX: readValue(context.initialValues, 'initialX', 'ix') ?? readValue(context.presetValues, 'initialX') ?? defaults.initialX,
      initialVx: readValue(context.initialValues, 'initialVx', 'ivx') ?? readValue(context.presetValues, 'initialVx') ?? defaults.initialVx,
    });

    const x = readValue(context.initialValues, 'x');
    const vx = readValue(context.initialValues, 'vx');
    if (x != null && vx != null) {
      model.setState([x, vx]);
      model.setParam('initialX', x);
      model.setParam('initialVx', vx);
    }

    const renderer = new RollerCoasterCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const b = renderer.getBounds();
      const impact = model.resolveBounds(b.minX, b.maxX);
      if (impact > 0.12) {
        const now = performance.now();
        if (now - lastImpactAt > 75) {
          context.onSfx('step', Math.min(1.3, impact));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onSpringMotion?.(k.speed, k.y);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x=${k.x.toFixed(2)} | y=${k.y.toFixed(2)}`,
        `vx=${k.vx.toFixed(2)} | speed=${k.speed.toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        gravity: p.gravity,
        damping: p.damping,
        trackAmplitude: p.trackAmplitude,
        trackFrequency: p.trackFrequency,
        trackTilt: p.trackTilt,
        boundaryRestitution: p.boundaryRestitution,
        initialX: p.initialX,
        initialVx: p.initialVx,
        x: k.x,
        vx: k.vx,
        y: k.y,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountRollerCoasterControls(context.menuRoot, model, redraw);

    const disposers: Array<() => void> = [];
    const on = (target: HTMLCanvasElement, type: string, handler: (event: PointerEvent) => void) => {
      const listener = handler as unknown as EventListener;
      target.addEventListener(type, listener);
      disposers.push(() => target.removeEventListener(type, listener));
    };

    const toCanvasPoint = (event: PointerEvent) => {
      const rect = context.canvas.getBoundingClientRect();
      const scaleX = context.canvas.width / rect.width;
      const scaleY = context.canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    };

    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const b = renderer.getBounds();
      const xDrag = Math.max(b.minX, Math.min(b.maxX, renderer.xFromPointer(p.x)));
      model.setState([xDrag, 0]);
      model.setParam('initialX', xDrag);
      model.setParam('initialVx', 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const car = renderer.carPixel();
      if (Math.hypot(p.x - car.x, p.y - car.y) > car.r) return;

      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      context.onSfx('drag-start', 0.9);
      applyDrag(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      applyDrag(event);
    });

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
      context.onSfx('drag-end', 0.8);
      resumeAfterDrag = false;
    };

    on(context.canvas, 'pointerup', endDrag);
    on(context.canvas, 'pointercancel', endDrag);

    redraw();

    const kickFromRestIfNeeded = () => {
      const state = model.getState();
      const x = state[0];
      const vx = state[1];
      const slope = model.trackSlope(x);
      if (Math.abs(vx) > 0.03 || Math.abs(slope) > 0.06) return;

      const tilt = model.getParams().trackTilt;
      const dir = tilt >= 0 ? 1 : -1;
      model.setState([x, 0.42 * dir]);
      redraw();
    };

    return {
      play: () => {
        kickFromRestIfNeeded();
        runner.start();
      },
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => runner.reset(),
      step: (count = 1) => runner.step(count),
      destroy: () => {
        runner.stop();
        context.onSpringMotion?.(0, 0);
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
