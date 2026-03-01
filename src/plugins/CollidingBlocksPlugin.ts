import { SimulationRunner } from '../core/simulationRunner';
import { CollidingBlocksCanvasRenderer } from '../render/collidingBlocksCanvasRenderer';
import { CollidingBlocks } from '../simulations/collidingBlocks';
import { mountCollidingBlocksControls } from '../ui/collidingBlocksControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const collidingBlocksPlugin: SimulationPlugin = {
  id: 'colliding-blocks',
  create(context: PluginContext): ActivePlugin {
    const defaults = CollidingBlocks.getDefaultParams();
    const model = new CollidingBlocks({
      ...defaults,
      ...context.presetValues,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      damping: readValue(context.initialValues, 'damping', 'd') ?? readValue(context.presetValues, 'damping') ?? defaults.damping,
      restitution: readValue(context.initialValues, 'restitution', 'e') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      wallRestitution:
        readValue(context.initialValues, 'wallRestitution', 'we') ??
        readValue(context.presetValues, 'wallRestitution') ??
        defaults.wallRestitution,
    });

    const renderer = new CollidingBlocksCanvasRenderer(context.canvas, model);

    let lastImpactAt = 0;
    const redraw = () => {
      const b = renderer.getWorldBounds();
      const impact = model.resolveCollisions(b.minX, b.maxX, b.minY, b.maxY);
      if (impact > 0.08) {
        const now = performance.now();
        if (now - lastImpactAt > 40) {
          context.onSfx('step', Math.min(1.5, impact));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | blocks=${k.count} | vmax=${k.maxSpeed.toFixed(2)}`,
        `E=${k.kinetic.toFixed(2)} | e=${model.getParams().restitution.toFixed(2)} | wall=${model.getParams().wallRestitution.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        gravity: p.gravity,
        damping: p.damping,
        restitution: p.restitution,
        wallRestitution: p.wallRestitution,
        blockSize: p.blockSize,
        rows: p.rows,
        cols: p.cols,
      });
    };

    const rebuild = (rows: number, cols: number) => {
      model.setParam('rows', rows);
      model.setParam('cols', cols);
      runner.reset();
    };

    const shuffle = (strength: number) => {
      model.kick(strength);
    };

    const runner = new SimulationRunner(model, redraw);
    mountCollidingBlocksControls(context.menuRoot, model, redraw, shuffle, rebuild);

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
    let dragTargetId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (dragTargetId == null) return;
      const p = toCanvasPoint(event);
      const world = renderer.screenToWorld(p.x, p.y);
      const bounds = renderer.getWorldBounds();
      const half = model.getParams().blockSize * 0.5;
      const x = Math.max(bounds.minX + half, Math.min(bounds.maxX - half, world.x));
      const y = Math.max(bounds.minY + half, Math.min(bounds.maxY - half, world.y));
      model.setBlockState(dragTargetId, x, y, 0, 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const hit = renderer.getBlockPixels().find((b) =>
        Math.abs(p.x - b.x) <= b.halfPx && Math.abs(p.y - b.y) <= b.halfPx,
      );
      if (!hit) return;

      dragPointerId = event.pointerId;
      dragTargetId = hit.id;
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
      dragTargetId = null;
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
