import { SimulationRunner } from '../core/simulationRunner';
import { RollerCoasterTwoBallsCanvasRenderer } from '../render/rollerCoasterTwoBallsCanvasRenderer';
import { RollerCoasterTwoBalls } from '../simulations/rollerCoasterTwoBalls';
import { mountRollerCoasterTwoBallsControls } from '../ui/rollerCoasterTwoBallsControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const rollerCoasterTwoBallsPlugin: SimulationPlugin = {
  id: 'roller-coaster-two-balls',
  create(context: PluginContext): ActivePlugin {
    const defaults = RollerCoasterTwoBalls.getDefaultParams();
    const model = new RollerCoasterTwoBalls({
      ...defaults,
      ...context.presetValues,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      trackAmplitude:
        readValue(context.initialValues, 'trackAmplitude', 'ta') ?? readValue(context.presetValues, 'trackAmplitude') ?? defaults.trackAmplitude,
      trackFrequency:
        readValue(context.initialValues, 'trackFrequency', 'tf') ?? readValue(context.presetValues, 'trackFrequency') ?? defaults.trackFrequency,
      trackTilt: readValue(context.initialValues, 'trackTilt', 'tt') ?? readValue(context.presetValues, 'trackTilt') ?? defaults.trackTilt,
      boundaryMode: readValue(context.initialValues, 'boundaryMode', 'bm') ?? readValue(context.presetValues, 'boundaryMode') ?? defaults.boundaryMode,
      boundaryRestitution:
        readValue(context.initialValues, 'boundaryRestitution', 'be') ??
        readValue(context.presetValues, 'boundaryRestitution') ??
        defaults.boundaryRestitution,
      ballRestitution:
        readValue(context.initialValues, 'ballRestitution', 'bre') ?? readValue(context.presetValues, 'ballRestitution') ?? defaults.ballRestitution,
      initialX1: readValue(context.initialValues, 'initialX1', 'ix1') ?? readValue(context.presetValues, 'initialX1') ?? defaults.initialX1,
      initialVx1: readValue(context.initialValues, 'initialVx1', 'ivx1') ?? readValue(context.presetValues, 'initialVx1') ?? defaults.initialVx1,
      initialX2: readValue(context.initialValues, 'initialX2', 'ix2') ?? readValue(context.presetValues, 'initialX2') ?? defaults.initialX2,
      initialVx2: readValue(context.initialValues, 'initialVx2', 'ivx2') ?? readValue(context.presetValues, 'initialVx2') ?? defaults.initialVx2,
    });

    const renderer = new RollerCoasterTwoBallsCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const [x1, vx1, x2, vx2] = model.getState();
      const cap = 4.8;
      if (Math.abs(vx1) > cap || Math.abs(vx2) > cap) {
        model.setState([x1, Math.sign(vx1) * Math.min(cap, Math.abs(vx1)), x2, Math.sign(vx2) * Math.min(cap, Math.abs(vx2))]);
      }

      const b = renderer.getBounds();
      const edgeImpact = model.resolveBounds(b.minX, b.maxX);
      const ballImpact = model.resolveBallCollision();
      const impact = Math.max(edgeImpact, ballImpact);
      if (impact > 0.1) {
        const now = performance.now();
        if (now - lastImpactAt > 40) {
          context.onSfx('step', Math.min(1.6, impact));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onSpringMotion?.(Math.max(k.speed1, k.speed2), (k.y1 + k.y2) * 0.5);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x1=${k.x1.toFixed(2)} x2=${k.x2.toFixed(2)}`,
        `v1=${k.vx1.toFixed(2)} | v2=${k.vx2.toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        gravity: p.gravity,
        damping: p.damping,
        trackAmplitude: p.trackAmplitude,
        trackFrequency: p.trackFrequency,
        trackTilt: p.trackTilt,
        boundaryMode: p.boundaryMode,
        boundaryRestitution: p.boundaryRestitution,
        ballRestitution: p.ballRestitution,
        initialX1: p.initialX1,
        initialVx1: p.initialVx1,
        initialX2: p.initialX2,
        initialVx2: p.initialVx2,
        x1: k.x1,
        vx1: k.vx1,
        y1: k.y1,
        x2: k.x2,
        vx2: k.vx2,
        y2: k.y2,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountRollerCoasterTwoBallsControls(context.menuRoot, model, redraw);

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

    let dragTarget: 1 | 2 | null = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragTarget) return;
      const p = toCanvasPoint(event);
      const b = renderer.getBounds();
      const xDrag = Math.max(b.minX, Math.min(b.maxX, renderer.xFromPointer(p.x)));
      if (dragTarget === 1) {
        model.setBallState(1, xDrag, 0);
        model.setParam('initialX1', xDrag);
        model.setParam('initialVx1', 0);
      } else {
        model.setBallState(2, xDrag, 0);
        model.setParam('initialX2', xDrag);
        model.setParam('initialVx2', 0);
      }
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const balls = renderer.ballPixels();
      const d1 = Math.hypot(p.x - balls.x1, p.y - balls.y1);
      const d2 = Math.hypot(p.x - balls.x2, p.y - balls.y2);
      if (d1 > balls.r && d2 > balls.r) return;

      dragTarget = d2 <= d1 ? 2 : 1;
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
      dragTarget = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
      context.onSfx('drag-end', 0.8);
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
        context.onSpringMotion?.(0, 0);
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
