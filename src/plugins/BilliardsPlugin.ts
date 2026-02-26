import { SimulationRunner } from '../core/simulationRunner';
import { BilliardsCanvasRenderer } from '../render/billiardsCanvasRenderer';
import { Billiards } from '../simulations/billiards';
import { mountBilliardsControls } from '../ui/billiardsControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const billiardsPlugin: SimulationPlugin = {
  id: 'billiards',
  create(context: PluginContext): ActivePlugin {
    const defaults = Billiards.getDefaultParams();
    const model = new Billiards({
      ...defaults,
      ...context.presetValues,
      restitution: readValue(context.initialValues, 'restitution', 'e') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      wallRestitution:
        readValue(context.initialValues, 'wallRestitution', 'we') ?? readValue(context.presetValues, 'wallRestitution') ?? defaults.wallRestitution,
      linearDamping:
        readValue(context.initialValues, 'linearDamping', 'd') ?? readValue(context.presetValues, 'linearDamping') ?? defaults.linearDamping,
      cueSpeed: readValue(context.initialValues, 'cueSpeed', 'cs') ?? readValue(context.presetValues, 'cueSpeed') ?? defaults.cueSpeed,
    });

    const renderer = new BilliardsCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const world = renderer.getWorldBounds();
      const impact = model.resolveCollisions(world.minX, world.maxX, world.minY, world.maxY);
      if (impact > 0.08) {
        const now = performance.now();
        if (now - lastImpactAt > 28) {
          context.onSfx('step', Math.min(1.6, Math.max(0.4, impact)));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      const cue = k.balls[0];
      const maxSpeed = Math.max(...k.balls.map((b) => Math.hypot(b.vx, b.vy)));
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | cue x=${cue.x.toFixed(2)} y=${cue.y.toFixed(2)}`,
        `cue v=${Math.hypot(cue.vx, cue.vy).toFixed(2)} | vmax=${maxSpeed.toFixed(2)} | E=${k.kinetic.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        restitution: p.restitution,
        wallRestitution: p.wallRestitution,
        linearDamping: p.linearDamping,
        cueSpeed: p.cueSpeed,
        cueX: cue.x,
        cueY: cue.y,
        cueVx: cue.vx,
        cueVy: cue.vy,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountBilliardsControls(context.menuRoot, model, redraw);

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
      return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    };

    let dragIndex: number | null = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (dragIndex == null) return;
      const p = toCanvasPoint(event);
      const world = renderer.getWorldBounds();
      const next = renderer.screenToWorld(p.x, p.y);
      const r = model.getParams().radius;
      const x = Math.max(world.minX + r, Math.min(world.maxX - r, next.x));
      const y = Math.max(world.minY + r, Math.min(world.maxY - r, next.y));
      model.setBallState(dragIndex, x, y, 0, 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const balls = renderer.getBallPixels();
      let best = -1;
      let bestD = Number.POSITIVE_INFINITY;
      balls.forEach((b, i) => {
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < bestD && d <= b.r) {
          best = i;
          bestD = d;
        }
      });
      if (best < 0) return;

      dragIndex = best;
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
