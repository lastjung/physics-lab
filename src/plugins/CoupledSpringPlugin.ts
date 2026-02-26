import { SimulationRunner } from '../core/simulationRunner';
import { CoupledSpringCanvasRenderer } from '../render/coupledSpringCanvasRenderer';
import { CoupledSpring } from '../simulations/coupledSpring';
import { mountCoupledSpringControls } from '../ui/coupledSpringControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const coupledSpringPlugin: SimulationPlugin = {
  id: 'coupled-spring',
  create(context: PluginContext): ActivePlugin {
    const defaults = CoupledSpring.getDefaultParams();
    const model = new CoupledSpring({
      ...defaults,
      ...context.presetValues,
      mass1: readValue(context.initialValues, 'mass1', 'm1') ?? readValue(context.presetValues, 'mass1') ?? defaults.mass1,
      mass2: readValue(context.initialValues, 'mass2', 'm2') ?? readValue(context.presetValues, 'mass2') ?? defaults.mass2,
      k1: readValue(context.initialValues, 'k1') ?? readValue(context.presetValues, 'k1') ?? defaults.k1,
      k2: readValue(context.initialValues, 'k2') ?? readValue(context.presetValues, 'k2') ?? defaults.k2,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      initialX1: readValue(context.initialValues, 'initialX1', 'ix1') ?? readValue(context.presetValues, 'initialX1') ?? defaults.initialX1,
      initialX2: readValue(context.initialValues, 'initialX2', 'ix2') ?? readValue(context.presetValues, 'initialX2') ?? defaults.initialX2,
      initialV1: readValue(context.initialValues, 'initialV1', 'iv1') ?? readValue(context.presetValues, 'initialV1') ?? defaults.initialV1,
      initialV2: readValue(context.initialValues, 'initialV2', 'iv2') ?? readValue(context.presetValues, 'initialV2') ?? defaults.initialV2,
    });

    const x1 = readValue(context.initialValues, 'x1');
    const x2 = readValue(context.initialValues, 'x2');
    const v1 = readValue(context.initialValues, 'v1');
    const v2 = readValue(context.initialValues, 'v2');
    if (x1 != null && x2 != null && v1 != null && v2 != null) {
      model.setState([x1, x2, v1, v2]);
      model.setParam('initialX1', x1);
      model.setParam('initialX2', x2);
      model.setParam('initialV1', v1);
      model.setParam('initialV2', v2);
    }

    const renderer = new CoupledSpringCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onSpringMotion?.(Math.max(Math.abs(k.v1), Math.abs(k.v2)), (k.x1 + k.x2) * 0.5);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x1=${k.x1.toFixed(2)} | x2=${k.x2.toFixed(2)}`,
        `v1=${k.v1.toFixed(2)} | v2=${k.v2.toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        mass1: p.mass1,
        mass2: p.mass2,
        k1: p.k1,
        k2: p.k2,
        damping: p.damping,
        initialX1: p.initialX1,
        initialX2: p.initialX2,
        initialV1: p.initialV1,
        initialV2: p.initialV2,
        x1: k.x1,
        x2: k.x2,
        v1: k.v1,
        v2: k.v2,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountCoupledSpringControls(context.menuRoot, model, redraw);

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

    type DragTarget = 'mass1' | 'mass2' | null;
    let dragTarget: DragTarget = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragTarget) return;
      const point = toCanvasPoint(event);
      const [x1, x2] = model.getState();
      if (dragTarget === 'mass1') {
        const nextX1 = Math.max(-1, Math.min(1, renderer.x1FromPointer(point.x)));
        model.setState([nextX1, x2, 0, 0]);
        model.setParam('initialX1', nextX1);
      } else {
        const nextX2 = Math.max(-1, Math.min(1, renderer.x2FromPointer(point.x)));
        model.setState([x1, nextX2, 0, 0]);
        model.setParam('initialX2', nextX2);
      }
      model.setParam('initialV1', 0);
      model.setParam('initialV2', 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const point = toCanvasPoint(event);
      const { m1x, m2x, y } = renderer.getMassPixelPositions();
      const d1 = Math.hypot(point.x - m1x, point.y - y);
      const d2 = Math.hypot(point.x - m2x, point.y - y);
      if (d1 > 42 && d2 > 42) return;

      dragTarget = d2 <= d1 ? 'mass2' : 'mass1';
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
