import { SimulationRunner } from '../core/simulationRunner';
import { NewtonsCradleCanvasRenderer } from '../render/newtonsCradleCanvasRenderer';
import { NewtonsCradle } from '../simulations/newtonsCradle';
import { mountNewtonsCradleControls } from '../ui/newtonsCradleControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const newtonsCradlePlugin: SimulationPlugin = {
  id: 'newtons-cradle',
  create(context: PluginContext): ActivePlugin {
    const defaults = NewtonsCradle.getDefaultParams();
    const model = new NewtonsCradle({
      ...defaults,
      ...context.presetValues,
      stiffness: readValue(context.initialValues, 'stiffness') ?? readValue(context.presetValues, 'stiffness') ?? defaults.stiffness,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      restitution: readValue(context.initialValues, 'restitution', 'e') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      spacing: readValue(context.initialValues, 'spacing', 'sp') ?? readValue(context.presetValues, 'spacing') ?? defaults.spacing,
      initialX1: readValue(context.initialValues, 'initialX1', 'ix1') ?? readValue(context.presetValues, 'initialX1') ?? defaults.initialX1,
      initialX5: readValue(context.initialValues, 'initialX5', 'ix5') ?? readValue(context.presetValues, 'initialX5') ?? defaults.initialX5,
      initialV1: readValue(context.initialValues, 'initialV1', 'iv1') ?? readValue(context.presetValues, 'initialV1') ?? defaults.initialV1,
      initialV5: readValue(context.initialValues, 'initialV5', 'iv5') ?? readValue(context.presetValues, 'initialV5') ?? defaults.initialV5,
    });

    const renderer = new NewtonsCradleCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const impact = model.resolveCollisions();
      if (impact > 0.025) {
        const now = performance.now();
        if (now - lastImpactAt > 26) {
          context.onSfx('step', Math.max(0.45, Math.min(1.6, impact * 1.15)));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x1=${k.x[0].toFixed(2)} | x5=${k.x[4].toFixed(2)}`,
        `v1=${k.v[0].toFixed(2)} | v5=${k.v[4].toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        stiffness: p.stiffness,
        damping: p.damping,
        restitution: p.restitution,
        spacing: p.spacing,
        initialX1: p.initialX1,
        initialX5: p.initialX5,
        initialV1: p.initialV1,
        initialV5: p.initialV5,
        x1: k.x[0],
        x2: k.x[1],
        x3: k.x[2],
        x4: k.x[3],
        x5: k.x[4],
        v1: k.v[0],
        v2: k.v[1],
        v3: k.v[2],
        v4: k.v[3],
        v5: k.v[4],
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountNewtonsCradleControls(context.menuRoot, model, redraw);

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

    let dragIndex: 0 | 4 | null = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (dragIndex == null) return;
      const p = toCanvasPoint(event);
      const displacement = Math.max(-0.62, Math.min(0.62, renderer.displacementFromPointer(dragIndex, p.x)));
      model.setBallState(dragIndex, displacement, 0);
      if (dragIndex === 0) {
        model.setParam('initialX1', displacement);
        model.setParam('initialV1', 0);
      } else {
        model.setParam('initialX5', displacement);
        model.setParam('initialV5', 0);
      }
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const balls = renderer.getBallPixels();
      const d1 = Math.hypot(p.x - balls[0].x, p.y - balls[0].y);
      const d5 = Math.hypot(p.x - balls[4].x, p.y - balls[4].y);
      if (d1 > balls[0].r && d5 > balls[4].r) return;

      dragIndex = d5 <= d1 ? 4 : 0;
      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      context.onSfx('drag-start', 0.95);
      applyDrag(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      applyDrag(event);
    });

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      dragIndex = null;
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
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
