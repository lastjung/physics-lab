import { SimulationPlugin, PluginContext } from './types';
import { SceneEditorSimulation } from '../simulations/sceneEditor';
import { SimulationRunner } from '../core/simulationRunner';
import { SceneEditorCanvasRenderer } from '../render/sceneEditorCanvasRenderer';

export const sceneEditorPlugin: SimulationPlugin = {
  id: 'scene-editor',
  create(context: PluginContext) {
    const model = new SceneEditorSimulation();
    const renderer = new SceneEditorCanvasRenderer(context.canvas);

    const redraw = () => {
      renderer.setZoom(150);
      renderer.render(model.getBodies(), model.getJoints());
    };

    const runner = new SimulationRunner(model, redraw);

    // --- Scaffold UI ---
    context.menuRoot.innerHTML = `
      <div class="menu-section">
        <h3 class="section-title">Scene Editor Scaffold</h3>
        <div class="controls">
          <button id="add-circle" class="game-btn active" style="width: 100%; margin-bottom: 8px;">Add Circle</button>
          <button id="clear-scene" class="game-btn secondary" style="width: 100%;">Clear Scene</button>
        </div>
      </div>
      <div class="help-text">
        Click 'Add Circle' to drop a ball from the center.
        This is a Phase-4 scaffold.
      </div>
    `;

    context.menuRoot.querySelector('#add-circle')?.addEventListener('click', () => {
        model.addCircle(0, -1.0, 0.1 + Math.random() * 0.1);
        redraw();
    });

    context.menuRoot.querySelector('#clear-scene')?.addEventListener('click', () => {
        model.reset();
        redraw();
    });

    redraw();

    return {
      play: () => runner.start(),
      pause: () => runner.stop(),
      isRunning: () => runner.isRunning(),
      reset: () => {
        model.reset();
        redraw();
      },
      step: (n: number) => runner.step(n),
      destroy: () => {
        runner.stop();
        context.menuRoot.innerHTML = '';
      },
      onResize: () => redraw(),
    };
  }
};
