import { SimulationRunner } from '../core/simulationRunner';
import { Engine2DCanvasRenderer } from '../render/engine2dCanvasRenderer';
import { CurvedObjectDemo } from '../simulations/curvedObjectDemo';
import { RigidRollerCoasterDemo } from '../simulations/rigidRollerCoasterDemo';
import { StringDemo } from '../simulations/stringDemo';
import { PendulumClockDemo } from '../simulations/pendulumClockDemo';
import { RigidDoublePendulumDemo } from '../simulations/rigidDoublePendulumDemo';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

function createSimpleEngine2DPlugin(id: string, ModelClass: any): SimulationPlugin {
    return {
        id,
        create(context: PluginContext): ActivePlugin {
            const defaults = ModelClass.getDefaultParams();
            const model = new ModelClass({ ...defaults, ...context.presetValues });
            const renderer = new Engine2DCanvasRenderer(context.canvas, model);
            
            const redraw = () => {
                renderer.draw();
                context.onStats(`Time: ${model.getTime().toFixed(2)}s`, `Bodies: ${model.getBodies().length}`);
            };

            const runner = new SimulationRunner(model, redraw);
            const disposers: Array<() => void> = [];

            // --- Mount parameter sliders ---
            const menuRoot = context.menuRoot;
            menuRoot.innerHTML = '';
            const title = document.createElement('h3');
            title.textContent = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Controls';
            title.className = 'section-title';
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'controls';

            const sliderConfigs: Record<string, { label: string; min: number; max: number; step: number }> = {
                gravity: { label: 'Gravity', min: 0, max: 30, step: 0.1 },
                restitution: { label: 'Restitution', min: 0, max: 1, step: 0.05 },
                friction: { label: 'Friction', min: 0, max: 1, step: 0.05 },
                frequency: { label: 'Stiffness', min: 1, max: 120, step: 1 },
                segments: { label: 'Segments', min: 5, max: 30, step: 1 },
                damping: { label: 'Damping', min: 0, max: 0.5, step: 0.01 },
                l1: { label: 'Length 1', min: 0.5, max: 5, step: 0.1 },
                l2: { label: 'Length 2', min: 0.5, max: 5, step: 0.1 },
                m1: { label: 'Mass 1', min: 0.1, max: 10, step: 0.1 },
                m2: { label: 'Mass 2', min: 0.1, max: 10, step: 0.1 },
                gearTorque: { label: 'Gear Torque', min: 0, max: 200, step: 5 },
                motorSpeed: { label: 'Motor Speed', min: 0, max: 2, step: 0.01 },
            };

            const params = model.getParams();
            for (const [key, val] of Object.entries(params)) {
                if (key === 'subSteps') continue;
                const cfg = sliderConfigs[key];
                if (!cfg) continue;
                const wrapper = document.createElement('label');
                const head = document.createElement('div');
                head.className = 'control-head';
                const labelEl = document.createElement('span');
                labelEl.textContent = cfg.label;
                const valueEl = document.createElement('span');
                valueEl.className = 'control-value';
                valueEl.textContent = (val as number).toFixed(2);
                const input = document.createElement('input');
                input.type = 'range';
                input.min = String(cfg.min);
                input.max = String(cfg.max);
                input.step = String(cfg.step);
                input.value = String(val);
                input.addEventListener('input', () => {
                    const next = Number(input.value);
                    valueEl.textContent = next.toFixed(2);
                    model.setParams({ [key]: next });
                    model.reset();
                    redraw();
                });
                head.append(labelEl, valueEl);
                wrapper.append(head, input);
                controlsDiv.append(wrapper);
            }
            menuRoot.append(title, controlsDiv);

            // Simple Drag
            const on = (target: HTMLElement, type: string, handler: (event: any) => void) => {
                target.addEventListener(type, handler);
                disposers.push(() => target.removeEventListener(type, handler));
            };

            let grabbingBody: any = null;
            let grabOffset = { x: 0, y: 0 };
            let resumeAfterDrag = false;

            on(context.canvas, 'pointerdown', (event: PointerEvent) => {
                const rect = context.canvas.getBoundingClientRect();
                const sx = (event.clientX - rect.left) * (context.canvas.width / rect.width);
                const sy = (event.clientY - rect.top) * (context.canvas.height / rect.height);
                const wp = renderer.screenToWorld(sx, sy);
                
                let closest: any = null;
                let minDist = 2.0;
                for (const b of model.getBodies()) {
                    if (b.invMass === 0) continue;
                    const d = Math.hypot(wp.x - b.x, wp.y - b.y);
                    if (d < minDist) { minDist = d; closest = b; }
                }

                if (closest) {
                    grabbingBody = closest;
                    grabOffset = { x: wp.x - closest.x, y: wp.y - closest.y };
                    context.canvas.setPointerCapture(event.pointerId);
                    resumeAfterDrag = runner.isRunning();
                    runner.stop();
                }
            });

            on(context.canvas, 'pointermove', (event: PointerEvent) => {
                if (!grabbingBody) return;
                const rect = context.canvas.getBoundingClientRect();
                const sx = (event.clientX - rect.left) * (context.canvas.width / rect.width);
                const sy = (event.clientY - rect.top) * (context.canvas.height / rect.height);
                const wp = renderer.screenToWorld(sx, sy);
                
                grabbingBody.x = wp.x - grabOffset.x;
                grabbingBody.y = wp.y - grabOffset.y;
                grabbingBody.vx = 0; grabbingBody.vy = 0; grabbingBody.omega = 0;
                redraw();
            });

            const release = (event: PointerEvent) => {
                if (!grabbingBody) return;
                grabbingBody = null;
                context.canvas.releasePointerCapture(event.pointerId);
                if (resumeAfterDrag) runner.start();
            };
            on(context.canvas, 'pointerup', release);
            on(context.canvas, 'pointercancel', release);

            redraw();

            return {
                play: () => runner.start(),
                pause: () => runner.stop(),
                isRunning: () => runner.isRunning(),
                reset: () => { runner.reset(); redraw(); },
                step: (n) => runner.step(n || 1),
                destroy: () => {
                    runner.stop();
                    disposers.forEach(d => d());
                    context.menuRoot.innerHTML = '';
                },
                onResize: () => redraw()
            };
        }
    };
}

export const curvedObjectPlugin = createSimpleEngine2DPlugin('curved-object', CurvedObjectDemo);
export const rigidRollerCoasterPlugin = createSimpleEngine2DPlugin('rigid-roller-coaster', RigidRollerCoasterDemo);
export const stringPlugin = createSimpleEngine2DPlugin('string', StringDemo);
export const pendulumClockPlugin = createSimpleEngine2DPlugin('pendulum-clock', PendulumClockDemo);
export const rigidDoublePendulumPlugin = createSimpleEngine2DPlugin('rigid-double-pendulum', RigidDoublePendulumDemo);
