import { SimulationRunner } from '../core/simulationRunner';
import { CarSuspensionCanvasRenderer } from '../render/carSuspensionCanvasRenderer';
import { CarSuspension } from '../simulations/carSuspension';
import { mountCarSuspensionControls } from '../ui/carSuspensionControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const carSuspensionPlugin: SimulationPlugin = {
  id: 'car-suspension',
  create(context: PluginContext): ActivePlugin {
    const defaults = CarSuspension.getDefaultParams();
    const model = new CarSuspension({
      ...defaults,
      ...context.presetValues,
      springK: readValue(context.initialValues, 'springK') ?? readValue(context.presetValues, 'springK') ?? defaults.springK,
      damperC: readValue(context.initialValues, 'damperC') ?? readValue(context.presetValues, 'damperC') ?? defaults.damperC,
      tireK: readValue(context.initialValues, 'tireK') ?? readValue(context.presetValues, 'tireK') ?? defaults.tireK,
      tireC: readValue(context.initialValues, 'tireC') ?? readValue(context.presetValues, 'tireC') ?? defaults.tireC,
      roadAmplitude:
        readValue(context.initialValues, 'roadAmplitude', 'ra') ?? readValue(context.presetValues, 'roadAmplitude') ?? defaults.roadAmplitude,
      roadFrequency:
        readValue(context.initialValues, 'roadFrequency', 'rf') ?? readValue(context.presetValues, 'roadFrequency') ?? defaults.roadFrequency,
      gripOffsetX:
        readValue(context.initialValues, 'gripOffsetX') ?? readValue(context.presetValues, 'gripOffsetX') ?? defaults.gripOffsetX,
      gripOffsetY:
        readValue(context.initialValues, 'gripOffsetY') ?? readValue(context.presetValues, 'gripOffsetY') ?? defaults.gripOffsetY,
    });

    const renderer = new CarSuspensionCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onSpringMotion?.(Math.max(Math.abs(k.vs), Math.abs(k.vu)), k.zs - k.zu);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | body=${k.zs.toFixed(3)} | wheel=${k.zu.toFixed(3)} | road=${k.zr.toFixed(3)}`,
        `vs=${k.vs.toFixed(2)} | vu=${k.vu.toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        springK: p.springK,
        damperC: p.damperC,
        tireK: p.tireK,
        tireC: p.tireC,
        roadAmplitude: p.roadAmplitude,
        roadFrequency: p.roadFrequency,
        gripOffsetX: p.gripOffsetX,
        gripOffsetY: p.gripOffsetY,
        zs: k.zs,
        zu: k.zu,
        vs: k.vs,
        vu: k.vu,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountCarSuspensionControls(context.menuRoot, model, redraw);

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

    let dragging = false;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragging) return;
      const p = toCanvasPoint(event);
      const zs = Math.max(-0.22, Math.min(0.22, renderer.sprungFromPointerY(p.y)));
      const [, zu] = model.getState();
      model.setState([zs, zu, 0, 0]);
      model.setParam('initialSprung', zs);
      model.setParam('initialSprungV', 0);
      model.setParam('initialUnsprungV', 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const grip = renderer.getGripRect();
      const hit = p.x >= grip.x && p.x <= grip.x + grip.width && p.y >= grip.y && p.y <= grip.y + grip.height;
      if (!hit) return;

      dragging = true;
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
      dragging = false;
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
        context.onSpringMotion?.(0, 0);
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
