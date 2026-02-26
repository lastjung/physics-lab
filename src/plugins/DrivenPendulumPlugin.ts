import { SimulationRunner } from '../core/simulationRunner';
import { DrivenPendulumCanvasRenderer } from '../render/drivenPendulumCanvasRenderer';
import { DrivenPendulum } from '../simulations/drivenPendulum';
import { mountDrivenPendulumControls } from '../ui/drivenPendulumControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const drivenPendulumPlugin: SimulationPlugin = {
  id: 'driven-pendulum',
  create(context: PluginContext): ActivePlugin {
    const defaults = DrivenPendulum.getDefaultParams();
    const model = new DrivenPendulum({
      ...defaults,
      ...context.presetValues,
      length: readValue(context.initialValues, 'length', 'l') ?? readValue(context.presetValues, 'length') ?? defaults.length,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      driveAmplitude:
        readValue(context.initialValues, 'driveAmplitude', 'da') ??
        readValue(context.presetValues, 'driveAmplitude') ??
        defaults.driveAmplitude,
      driveFrequency:
        readValue(context.initialValues, 'driveFrequency', 'df') ??
        readValue(context.presetValues, 'driveFrequency') ??
        defaults.driveFrequency,
      initialAngle:
        readValue(context.initialValues, 'initialAngle', 'ia') ??
        readValue(context.presetValues, 'initialAngle') ??
        defaults.initialAngle,
      initialAngularVelocity:
        readValue(context.initialValues, 'initialAngularVelocity', 'iw') ??
        readValue(context.presetValues, 'initialAngularVelocity') ??
        defaults.initialAngularVelocity,
    });

    const theta = readValue(context.initialValues, 'theta', 'th');
    const omega = readValue(context.initialValues, 'omega', 'om');
    if (theta != null && omega != null) {
      model.setState([theta, omega]);
      model.setParam('initialAngle', theta);
      model.setParam('initialAngularVelocity', omega);
    }

    const renderer = new DrivenPendulumCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onPendulumMotion?.(k.omega, k.theta);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | theta=${k.theta.toFixed(2)} rad`,
        `omega=${k.omega.toFixed(2)} rad/s | E=${k.total.toFixed(2)} J`,
      );

      const p = model.getParams();
      context.onStateChange({
        length: p.length,
        gravity: p.gravity,
        damping: p.damping,
        driveAmplitude: p.driveAmplitude,
        driveFrequency: p.driveFrequency,
        initialAngle: p.initialAngle,
        initialAngularVelocity: p.initialAngularVelocity,
        theta: k.theta,
        omega: k.omega,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountDrivenPendulumControls(context.menuRoot, model, redraw);

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

    const applyPointerAngle = (event: PointerEvent) => {
      const { x, y } = toCanvasPoint(event);
      const { originX, originY } = renderer.getSceneMetrics();
      const dx = x - originX;
      const dy = y - originY;
      const angle = Math.atan2(dx, dy);
      model.setState([angle, 0]);
      model.setParam('initialAngle', angle);
      model.setParam('initialAngularVelocity', 0);
      redraw();
    };

    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const point = toCanvasPoint(event);
      const bob = renderer.getBobPixelPosition();
      const distance = Math.hypot(point.x - bob.x, point.y - bob.y);
      if (distance > 26) return;

      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      context.onSfx('drag-start', 0.9);
      applyPointerAngle(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      applyPointerAngle(event);
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
