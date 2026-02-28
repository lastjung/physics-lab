import { SimulationRunner } from '../core/simulationRunner';
import { HangingChainCanvasRenderer } from '../render/hangingChainCanvasRenderer';
import { HangingChain } from '../simulations/hangingChain';
import { mountHangingChainControls } from '../ui/hangingChainControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

export const hangingChainPlugin: SimulationPlugin = {
  id: 'hanging-chain',
  create(context: PluginContext): ActivePlugin {
    const defaults = HangingChain.getDefaultParams();
    const model = new HangingChain({
      ...defaults,
      ...context.presetValues
    });

    const renderer = new HangingChainCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const world = renderer.getWorldBounds();
      const impact = model.resolveCollisions(world.minX, world.maxX, world.minY, world.maxY);
      
      if (impact > 0.1) {
        const now = performance.now();
        if (now - lastImpactAt > 30) {
          context.onSfx('step', Math.min(1.0, impact * 0.5));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const stats = model.getStats();
      context.onStats(
        `Segments: ${model.getParams().segments} | Avg Error: ${stats.avgError.toExponential(2)}`,
        `Time: ${model.getTime().toFixed(2)}s`
      );

      context.onStateChange({
          avgError: stats.avgError,
          time: model.getTime()
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountHangingChainControls(context.menuRoot, model, redraw);

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
      const worldPos = renderer.screenToWorld(p.x, p.y);
      const state = model.getState();
      state[dragIndex * 4] = worldPos.x;
      state[dragIndex * 4 + 1] = worldPos.y;
      state[dragIndex * 4 + 2] = 0;
      state[dragIndex * 4 + 3] = 0;
      model.setState(state);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const nodes = renderer.getNodePixels();
      let best = -1;
      let bestD = Infinity;

      nodes.forEach((node, i) => {
          const d = Math.hypot(p.x - node.x, p.y - node.y);
          if (d < bestD && d <= node.r * 2) {
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
      applyDrag(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId === event.pointerId) applyDrag(event);
    });

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      dragIndex = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
    };

    on(context.canvas, 'pointerup', endDrag);
    on(context.canvas, 'pointercancel', endDrag);

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => runner.reset(),
      step: (n) => runner.step(n),
      destroy: () => {
        runner.stop();
        disposers.forEach(d => d());
        context.menuRoot.innerHTML = '';
      }
    };
  }
};
