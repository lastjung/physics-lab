import { SimulationRunner } from '../core/simulationRunner';
import { PileAttractCanvasRenderer } from '../render/pileAttractCanvasRenderer';
import { PileAttract } from '../simulations/pileAttract';
import { mountPileAttractControls } from '../ui/pileAttractControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

export const pileAttractPlugin: SimulationPlugin = {
  id: 'pile-attract',
  create(context: PluginContext): ActivePlugin {
    const defaults = PileAttract.getDefaultParams();
    const model = new PileAttract({
      ...defaults,
      ...context.presetValues
    });

    const renderer = new PileAttractCanvasRenderer(context.canvas, model);
    let lastImpactAt = 0;

    const redraw = () => {
      const world = renderer.getWorldBounds();
      const impact = model.resolveCollisions(world.minX, world.maxX, world.minY, world.maxY);
      
      if (impact > 0.05) {
        const now = performance.now();
        if (now - lastImpactAt > 40) {
          context.onSfx('step', Math.min(1.0, impact * 0.3));
          lastImpactAt = now;
        }
      }

      renderer.draw();
      const stats = model.getStats();
      context.onStats(
        `Particles: ${stats.particleCount} | Avg R: ${stats.avgRadius.toFixed(3)}`,
        `Attractor: (${model.getParams().attractorX.toFixed(2)}, ${model.getParams().attractorY.toFixed(2)})`
      );

      context.onStateChange({
          avgRadius: stats.avgRadius,
          time: model.getTime()
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountPileAttractControls(context.menuRoot, model, redraw);

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

    let isDragging = false;
    const updateAttractor = (event: PointerEvent) => {
      if (!isDragging) return;
      const p = toCanvasPoint(event);
      const worldPos = renderer.screenToWorld(p.x, p.y);
      model.setParam('attractorX', worldPos.x);
      model.setParam('attractorY', worldPos.y);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      isDragging = true;
      context.canvas.setPointerCapture(event.pointerId);
      updateAttractor(event);
    });

    on(context.canvas, 'pointermove', updateAttractor);

    const stopDragging = (event: PointerEvent) => {
      isDragging = false;
      context.canvas.releasePointerCapture(event.pointerId);
    };

    on(context.canvas, 'pointerup', stopDragging);
    on(context.canvas, 'pointercancel', stopDragging);

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
