import { SimulationRunner } from '../core/simulationRunner';
import { WheelJointDemoCanvasRenderer } from '../render/wheelJointDemoCanvasRenderer';
import { WheelJointDemo } from '../simulations/wheelJointDemo';
import { mountWheelJointDemoControls } from '../ui/wheelJointDemoControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

export const wheelJointDemoPlugin: SimulationPlugin = {
  id: 'wheel-joint-demo',
  create(context: PluginContext): ActivePlugin {
    const defaults = WheelJointDemo.getDefaultParams();
    const model = new WheelJointDemo({
      ...defaults,
      ...context.presetValues
    });

    const renderer = new WheelJointDemoCanvasRenderer(context.canvas, model);
    
    const redraw = () => {
      renderer.draw();
      
      const p = model.getParams();
      context.onStats(
        `K: ${p.stiffness.toFixed(0)} | D: ${p.damping.toFixed(1)} | Motor: ${p.motorSpeed.toFixed(1)}`,
        `Time: ${model.getTime().toFixed(2)}s | Steps: ${p.subSteps}`
      );
    };

    const runner = new SimulationRunner(model, redraw);

    const uiControls = mountWheelJointDemoControls(context.menuRoot, model, redraw);

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

    let grabbingBody: any = null;
    let grabOffset = { x: 0, y: 0 };
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!grabbingBody) return;
      const cp = toCanvasPoint(event);
      const wp = renderer.screenToWorld(cp.x, cp.y);
      
      const dx = wp.x - grabOffset.x - grabbingBody.x;
      const dy = wp.y - grabOffset.y - grabbingBody.y;

      if (grabbingBody.id === 'chassis') {
        const bodies = model.getBodies();
        for (const b of bodies) {
          if (b.invMass > 0) {
            b.x += dx;
            b.y += dy;
            b.vx = 0;
            b.vy = 0;
            b.omega = 0;
          }
        }
      } else {
        grabbingBody.x += dx;
        grabbingBody.y += dy;
        grabbingBody.vx = 0;
        grabbingBody.vy = 0;
        grabbingBody.omega = 0;
      }

      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const cp = toCanvasPoint(event);
      const wp = renderer.screenToWorld(cp.x, cp.y);
      const bodies = model.getBodies();
      
      let closest: any = null;
      let minDist = 0.5;

      for (const b of bodies) {
        if (b.invMass === 0) continue;
        const dist = Math.hypot(wp.x - b.x, wp.y - b.y);
        if (dist < minDist) {
          minDist = dist;
          closest = b;
        }
      }

      if (closest) {
        grabbingBody = closest;
        grabOffset = { x: wp.x - closest.x, y: wp.y - closest.y };
        context.canvas.setPointerCapture(event.pointerId);
        resumeAfterDrag = runner.isRunning();
        runner.stop();
        applyDrag(event);
      }
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (grabbingBody) applyDrag(event);
    });
    
    const release = (event: PointerEvent) => {
      if (!grabbingBody) return;
      grabbingBody = null;
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
      step: (n) => {
          for (let i = 0; i < (n || 1); i++) runner.step(1);
      },
      destroy: () => {
        runner.stop();
        disposers.forEach(d => d());
        context.menuRoot.innerHTML = '';
      },
      onResize: (w, h) => {
          redraw();
      },
      onPause: () => {},
      onResume: () => {}
    };
  }
};
