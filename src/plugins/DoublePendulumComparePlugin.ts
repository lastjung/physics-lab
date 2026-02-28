import { SimulationRunner } from '../core/simulationRunner';
import { DoublePendulumCompareCanvasRenderer } from '../render/doublePendulumCompareCanvasRenderer';
import { DoublePendulumCompare } from '../simulations/doublePendulumCompare';
import { mountDoublePendulumCompareControls } from '../ui/doublePendulumCompareControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

export const doublePendulumComparePlugin: SimulationPlugin = {
  id: 'double-pendulum-compare',
  create(context: PluginContext): ActivePlugin {
    const defaults = DoublePendulumCompare.getDefaultParams();
    const model = new DoublePendulumCompare({
      ...defaults,
      ...context.presetValues
    });

    const renderer = new DoublePendulumCompareCanvasRenderer(context.canvas, model);
    
    const redraw = () => {
      renderer.draw();
      const stats = model.getStats();
      const lyapStr = stats.lyapunov.toFixed(4);
      
      context.onStats(
        `Phase Distance: ${stats.distance.toExponential(3)} | λ ≈ ${lyapStr}`,
        `Time: ${model.getTime().toFixed(2)}s | ε: ${model.getParams().epsilon.toExponential(1)}`
      );

      context.onStateChange({
          distance: stats.distance,
          lyapunov: stats.lyapunov,
          time: model.getTime()
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountDoublePendulumCompareControls(context.menuRoot, model, redraw, (show) => {
        renderer.showTrails = show;
        if (!show) renderer.clearTrails();
    });

    // Interaction logic
    let isDragging = false;
    
    const getCoords = (e: PointerEvent) => {
        const rect = context.canvas.getBoundingClientRect();
        const sx = (e.clientX - rect.left) * (context.canvas.width / rect.width);
        const sy = (e.clientY - rect.top) * (context.canvas.height / rect.height);
        return renderer.screenToWorld(sx, sy);
    };

    context.canvas.addEventListener('pointerdown', (e) => {
        const world = getCoords(e);
        const pos = model.getPositions();
        
        // Check if clicking near mass 2 of Pendulum A (radius 0.3 window)
        const d2 = Math.hypot(world.x - pos.a.x2, world.y - pos.a.y2);
        if (d2 < 0.3) {
            isDragging = true;
            runner.stop();
            context.canvas.setPointerCapture(e.pointerId);
            e.preventDefault();
        }
    });

    context.canvas.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const mouse = getCoords(e);
        
        const params = model.getParams();
        const { l1, l2 } = params;
        const d = Math.max(0.1, Math.min(l1 + l2 - 0.01, Math.hypot(mouse.x, mouse.y)));
        
        const alpha = Math.atan2(mouse.x, mouse.y);
        const cosBeta = (l1*l1 + d*d - l2*l2) / (2 * l1 * d);
        const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
        
        // Elbow solution
        const t1 = alpha - beta; 
        
        const x1 = l1 * Math.sin(t1);
        const y1 = l1 * Math.cos(t1);
        const t2 = Math.atan2(mouse.x - x1, mouse.y - y1);
        
        model.setAngles(t1, t2);
        redraw();
    });

    context.canvas.addEventListener('pointerup', () => {
        isDragging = false;
    });

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => {
          runner.reset();
          renderer.clearTrails();
          redraw();
      },
      step: (n) => runner.step(n),
      destroy: () => {
        runner.stop();
        context.menuRoot.innerHTML = '';
      }
    };
  }
};
