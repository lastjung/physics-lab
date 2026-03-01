import { SimulationPlugin, PluginContext } from './types';
import { SceneEditorSimulation } from '../simulations/sceneEditor';
import { SimulationRunner } from '../core/simulationRunner';
import { SceneEditorCanvasRenderer } from '../render/sceneEditorCanvasRenderer';
import { Joint, RevoluteJoint, PrismaticJoint } from '../engine2d/joints/types';

export const sceneEditorPlugin: SimulationPlugin = {
  id: 'scene-editor',
  create(context: PluginContext) {
    const STORAGE_KEY = 'physics-lab-scene-editor';
    const model = new SceneEditorSimulation();
    const renderer = new SceneEditorCanvasRenderer(context.canvas);
    let selectedId: string | null = null;
    let isDragging = false;
    let jointMode: 'revolute' | 'prismatic' | 'weld' | null = null;
    let pendingBodyA: string | null = null;

    const saveScene = () => {
        localStorage.setItem(STORAGE_KEY, model.serialize());
    };

    const loadScene = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) model.deserialize(data);
    };

    loadScene();

    const renderPropsPanel = () => {
        if (!selectedId) return `<p style="opacity: 0.5;">No selection</p>`;
        const body = model.getBodies().find(b => b.id === selectedId);
        const joint = model.getJoints().find(j => j.id === selectedId);

        if (body) {
            return `
                <div style="font-size: 0.85rem;">
                    <strong>Body: ${body.id.split('_')[0]}</strong>
                    <div style="margin-top: 8px;">
                      Friction: <input type="number" step="0.1" class="prop-input" data-key="friction" value="${body.friction}">
                    </div>
                    <button id="del-obj" class="game-btn secondary" style="width: 100%; margin-top: 8px; color: #ef4444;">Delete</button>
                </div>
            `;
        }
        if (joint) {
            const isRev = joint.type === 'revolute';
            const isPrism = joint.type === 'prismatic';
            const isWeld = joint.type === 'weld';
            const j = joint as any; // Safe cast for dynamic prop access in template
            
            return `
                <div style="font-size: 0.85rem;">
                    <strong>Joint: ${joint.type}</strong>
                    <div style="margin-top: 8px; display: grid; gap: 4px;">
                        ${!isWeld ? `
                            <label><input type="checkbox" class="prop-input" data-key="motorEnabled" ${j.motorEnabled ? 'checked' : ''}> Motor</label>
                            Speed: <input type="number" step="0.5" class="prop-input" data-key="motorSpeed" value="${j.motorSpeed || 0}">
                            <label><input type="checkbox" class="prop-input" data-key="limitEnabled" ${j.limitEnabled ? 'checked' : ''}> Limits</label>
                            ${isRev ? `
                                Min Angle: <input type="number" step="0.1" class="prop-input" data-key="lowerAngle" value="${j.lowerAngle || 0}">
                                Max Angle: <input type="number" step="0.1" class="prop-input" data-key="upperAngle" value="${j.upperAngle || 0}">
                            ` : ''}
                            ${isPrism ? `
                                Min Dist: <input type="number" step="0.1" class="prop-input" data-key="lowerTranslation" value="${j.lowerTranslation || 0}">
                                Max Dist: <input type="number" step="0.1" class="prop-input" data-key="upperTranslation" value="${j.upperTranslation || 0}">
                            ` : ''}
                        ` : '<p>Rigid connection</p>'}
                    </div>
                    <button id="del-obj" class="game-btn secondary" style="width: 100%; margin-top: 8px; color: #ef4444;">Delete</button>
                </div>
            `;
        }
        return '';
    };

    const updateUI = () => {
        const menu = context.menuRoot;
        menu.innerHTML = `
          <div class="menu-section">
            <h3 class="section-title">Scene Editor</h3>
            <div class="controls" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="add-circle" class="game-btn active">+ Circle</button>
              <button id="add-box" class="game-btn active">+ Box</button>
              <button id="mode-rev" class="game-btn ${jointMode === 'revolute' ? 'active' : 'secondary'}">Revolute</button>
              <button id="mode-prism" class="game-btn ${jointMode === 'prismatic' ? 'active' : 'secondary'}">Prismatic</button>
              <button id="mode-weld" class="game-btn ${jointMode === 'weld' ? 'active' : 'secondary'}">Weld</button>
              <button id="export-json" class="game-btn secondary">Export</button>
              <button id="import-json" class="game-btn secondary" style="grid-column: span 1;">Import</button>
              <button id="clear-scene" class="game-btn secondary" style="grid-column: span 2;">Clear Scene</button>
            </div>
          </div>
          <div id="props-panel" class="menu-section" style="border-top: 1px solid #e2e8f0; margin-top: 12px; padding-top: 12px;">
            ${renderPropsPanel()}
          </div>
          <div class="help-text">
            ${jointMode ? `Joint mode: Click two bodies to link.` : `Click select, Drag move.`}
          </div>
        `;

        menu.querySelector('#add-circle')?.addEventListener('click', () => { model.addCircle(0, -1.0, 0.15); saveScene(); redraw(); });
        menu.querySelector('#add-box')?.addEventListener('click', () => { model.addBox(0, -1.0, 0.3, 0.2); saveScene(); redraw(); });
        menu.querySelector('#mode-rev')?.addEventListener('click', () => { jointMode = (jointMode === 'revolute' ? null : 'revolute'); pendingBodyA = null; updateUI(); });
        menu.querySelector('#mode-prism')?.addEventListener('click', () => { jointMode = (jointMode === 'prismatic' ? null : 'prismatic'); pendingBodyA = null; updateUI(); });
        menu.querySelector('#mode-weld')?.addEventListener('click', () => { jointMode = (jointMode === 'weld' ? null : 'weld'); pendingBodyA = null; updateUI(); });
        menu.querySelector('#clear-scene')?.addEventListener('click', () => { model.reset(); selectedId = null; saveScene(); redraw(); updateUI(); });
        
        menu.querySelector('#export-json')?.addEventListener('click', () => {
             const blob = new Blob([model.serialize()], { type: 'application/json' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url; a.download = `scene.json`; a.click();
             URL.revokeObjectURL(url);
        });

        menu.querySelector('#import-json')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e: any) => {
                const reader = new FileReader();
                reader.onload = (re) => { 
                    if (re.target?.result) {
                        model.deserialize(re.target.result as string); 
                        saveScene(); redraw(); updateUI(); 
                    }
                };
                reader.readAsText(e.target.files[0]);
            };
            input.click();
        });

        menu.querySelectorAll('.prop-input').forEach(input => {
            input.addEventListener('change', (e: any) => {
                const key = e.target.dataset.key;
                const val = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
                const joint = model.getJoints().find(j => j.id === selectedId);
                const body = model.getBodies().find(b => b.id === selectedId);
                if (joint) model.updateJoint(joint.id, { [key]: val });
                else if (body) (body as any)[key] = val;
                saveScene(); redraw();
            });
        });

        menu.querySelector('#del-obj')?.addEventListener('click', () => {
            if (!selectedId) return;
            model.removeJoint(selectedId);
            const bodies = model.getBodies();
            const idx = bodies.findIndex(b => b.id === selectedId);
            if (idx !== -1 && bodies[idx].id !== 'floor') bodies.splice(idx, 1);
            selectedId = null;
            saveScene(); redraw(); updateUI();
        });
    };

    const redraw = () => {
      renderer.setZoom(150);
      renderer.render(model.getBodies(), model.getJoints(), selectedId);
    };

    const runner = new SimulationRunner(model, redraw);

    context.canvas.addEventListener('pointerdown', (e) => {
        const rect = context.canvas.getBoundingClientRect();
        const world = renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hitBody = model.getBodyAt(world.x, world.y);
        const hitJoint = model.getJointAt(world.x, world.y);

        if (jointMode && hitBody) {
            if (!pendingBodyA) {
                pendingBodyA = hitBody.id;
                selectedId = hitBody.id;
            } else if (pendingBodyA !== hitBody.id) {
                if (jointMode === 'revolute') model.addRevoluteJoint(pendingBodyA, hitBody.id, world);
                else if (jointMode === 'prismatic') model.addPrismaticJoint(pendingBodyA, hitBody.id, world, { x: 1, y: 0 });
                else if (jointMode === 'weld') model.addWeldJoint(pendingBodyA, hitBody.id, world);
                jointMode = null; pendingBodyA = null;
            }
            saveScene(); redraw(); updateUI();
            return;
        }

        if (hitBody) {
            selectedId = hitBody.id;
            isDragging = true;
            context.onSfx('click', 0.5);
        } else if (hitJoint) {
            selectedId = hitJoint.id;
        } else {
            selectedId = null;
        }
        redraw(); updateUI();
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || !selectedId) return;
        const rect = context.canvas.getBoundingClientRect();
        const world = renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const bodies = model.getBodies();
        const body = bodies.find(b => b.id === selectedId);
        if (body) {
            body.x = world.x; body.y = world.y;
            body.vx = 0; body.vy = 0;
            redraw();
        }
    });

    window.addEventListener('pointerup', () => {
        if (isDragging) saveScene();
        isDragging = false;
    });

    updateUI();
    redraw();

    return {
      play: () => runner.start(),
      pause: () => { runner.stop(); saveScene(); },
      isRunning: () => runner.isRunning(),
      reset: () => { model.reset(); selectedId = null; saveScene(); redraw(); updateUI(); },
      step: (n: number) => runner.step(n),
      destroy: () => { runner.stop(); saveScene(); context.menuRoot.innerHTML = ''; },
      onResize: () => redraw(),
    };
  }
};
