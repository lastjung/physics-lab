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
    // Overwrite the default step method because WheelJointDemo handles integration inside resolveCollisions
    (runner as any).step = (dt: number) => {
        model.resolveCollisions(dt);
        model.setTime(model.getTime() + dt);
        redraw();
    };

    const uiControls = mountWheelJointDemoControls(context.menuRoot, model, redraw);

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
          for (let i = 0; i < (n || 1); i++) (runner as any).step(1/120);
      },
      destroy: () => {
        runner.stop();
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
