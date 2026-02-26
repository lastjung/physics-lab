import { SimulationRunner } from '../core/simulationRunner';
import { DoublePendulumCanvasRenderer } from '../render/doublePendulumCanvasRenderer';
import { DoublePendulum } from '../simulations/doublePendulum';
import { mountDoublePendulumControls } from '../ui/doublePendulumControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const doublePendulumPlugin: SimulationPlugin = {
  id: 'double-pendulum',
  create(context: PluginContext): ActivePlugin {
    const defaults = DoublePendulum.getDefaultParams();
    const model = new DoublePendulum({
      ...defaults,
      ...context.presetValues,
      length1: readValue(context.initialValues, 'length1') ?? readValue(context.presetValues, 'length1') ?? defaults.length1,
      length2: readValue(context.initialValues, 'length2') ?? readValue(context.presetValues, 'length2') ?? defaults.length2,
      mass1: readValue(context.initialValues, 'mass1') ?? readValue(context.presetValues, 'mass1') ?? defaults.mass1,
      mass2: readValue(context.initialValues, 'mass2') ?? readValue(context.presetValues, 'mass2') ?? defaults.mass2,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      initialTheta1:
        readValue(context.initialValues, 'initialTheta1', 'th1') ??
        readValue(context.presetValues, 'initialTheta1') ??
        defaults.initialTheta1,
      initialTheta2:
        readValue(context.initialValues, 'initialTheta2', 'th2') ??
        readValue(context.presetValues, 'initialTheta2') ??
        defaults.initialTheta2,
      initialOmega1:
        readValue(context.initialValues, 'initialOmega1', 'om1') ??
        readValue(context.presetValues, 'initialOmega1') ??
        defaults.initialOmega1,
      initialOmega2:
        readValue(context.initialValues, 'initialOmega2', 'om2') ??
        readValue(context.presetValues, 'initialOmega2') ??
        defaults.initialOmega2,
    });

    const renderer = new DoublePendulumCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onPendulumMotion?.(k.omega1, k.theta1);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | th1=${k.theta1.toFixed(2)} | th2=${k.theta2.toFixed(2)}`,
        `w1=${k.omega1.toFixed(2)} | w2=${k.omega2.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        length1: p.length1,
        length2: p.length2,
        mass1: p.mass1,
        mass2: p.mass2,
        gravity: p.gravity,
        damping: p.damping,
        initialTheta1: p.initialTheta1,
        initialTheta2: p.initialTheta2,
        initialOmega1: p.initialOmega1,
        initialOmega2: p.initialOmega2,
        th1: k.theta1,
        th2: k.theta2,
        om1: k.omega1,
        om2: k.omega2,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountDoublePendulumControls(context.menuRoot, model, redraw);

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

    type DragTarget = 'bob1' | 'bob2' | null;
    let dragTarget: DragTarget = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragTarget) return;
      const point = toCanvasPoint(event);
      const [theta1, theta2] = model.getState();
      const { originX, originY } = renderer.getSceneMetrics();
      const { p1x, p1y } = renderer.getBobPixelPositions();

      if (dragTarget === 'bob1') {
        const angle1 = Math.atan2(point.x - originX, point.y - originY);
        model.setState([angle1, theta2, 0, 0]);
        model.setParam('initialTheta1', angle1);
        model.setParam('initialOmega1', 0);
        model.setParam('initialOmega2', 0);
      } else if (dragTarget === 'bob2') {
        const angle2 = Math.atan2(point.x - p1x, point.y - p1y);
        model.setState([theta1, angle2, 0, 0]);
        model.setParam('initialTheta2', angle2);
        model.setParam('initialOmega1', 0);
        model.setParam('initialOmega2', 0);
      }
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const point = toCanvasPoint(event);
      const { p1x, p1y, p2x, p2y } = renderer.getBobPixelPositions();
      const d1 = Math.hypot(point.x - p1x, point.y - p1y);
      const d2 = Math.hypot(point.x - p2x, point.y - p2y);

      if (d1 > 20 && d2 > 24) return;

      dragTarget = d2 <= d1 ? 'bob2' : 'bob1';
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
      dragTarget = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
      context.onSfx('drag-end', 0.85);
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
        context.onPendulumMotion?.(0, 0);
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
