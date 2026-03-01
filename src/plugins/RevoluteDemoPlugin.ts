import { SimulationRunner } from '../core/simulationRunner';
import { RevoluteDemoCanvasRenderer } from '../render/revoluteDemoCanvasRenderer';
import { RevoluteDemo } from '../simulations/revoluteDemo';
import { mountRevoluteDemoControls } from '../ui/revoluteDemoControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

export const revoluteDemoPlugin: SimulationPlugin = {
  id: 'revolute-demo',
  create(context: PluginContext): ActivePlugin {
    const defaults = RevoluteDemo.getDefaultParams();
    const model = new RevoluteDemo({
      ...defaults,
      ...context.presetValues
    });

    const renderer = new RevoluteDemoCanvasRenderer(context.canvas, model);
    
    const redraw = () => {
      model.resolveCollisions();
      renderer.draw();
      const stats = model.getJointState();
      
      context.onStats(
        `Angle: ${stats.angle.toFixed(2)} rad | Speed: ${stats.speed.toFixed(2)}`,
        `Time: ${model.getTime().toFixed(2)}s`
      );

      context.onStateChange({
          angle: stats.angle,
          speed: stats.speed,
          time: model.getTime()
      });

      // Update UI stats if available
      if (uiControls && uiControls.updateStats) {
          uiControls.updateStats();
      }
    };

    const runner = new SimulationRunner(model, redraw);
    const uiControls = mountRevoluteDemoControls(context.menuRoot, model, redraw);

    // --- Interaction logic ---
    const disposers: Array<() => void> = [];
    const on = (target: HTMLElement, type: string, handler: (event: any) => void) => {
      target.addEventListener(type, handler);
      disposers.push(() => target.removeEventListener(type, handler));
    };

    const toCanvasPoint = (event: PointerEvent) => {
      const rect = context.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (context.canvas.width / rect.width),
        y: (event.clientY - rect.top) * (context.canvas.height / rect.height)
      };
    };

    let grabbing = false;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!grabbing) return;
      const cp = toCanvasPoint(event);
      const wp = renderer.screenToWorld(cp.x, cp.y);
      
      const angle = Math.atan2(wp.y, wp.x);
      const L = 0.4; // Arm length
      const x = L * Math.cos(angle);
      const y = L * Math.sin(angle);
      
      // Update state: [x, y, vx, vy, angle, omega]
      model.setState([x, y, 0, 0, angle, 0]);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const cp = toCanvasPoint(event);
      const wp = renderer.screenToWorld(cp.x, cp.y);
      const state = model.getState();
      const dist = Math.hypot(wp.x - state[0], wp.y - state[1]);
      
      if (dist < 0.15) { // Grab radius
        grabbing = true;
        context.canvas.setPointerCapture(event.pointerId);
        resumeAfterDrag = runner.isRunning();
        runner.stop();
        applyDrag(event);
      }
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (grabbing) applyDrag(event);
    });
    
    const release = (event: PointerEvent) => {
      if (!grabbing) return;
      grabbing = false;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
    };

    on(context.canvas, 'pointerup', release);
    on(context.canvas, 'pointercancel', release);
    // -------------------------

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => {
          runner.reset();
          redraw();
      },
      step: (n) => runner.step(n),
      destroy: () => {
        runner.stop();
        disposers.forEach(d => d());
        context.menuRoot.innerHTML = '';
      },
      onResize: (w, h) => {
          redraw();
      },
      onPause: () => {
      },
      onResume: () => {
      }
    };
  }
};
