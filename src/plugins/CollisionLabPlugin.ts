import { SimulationRunner } from '../core/simulationRunner';
import { CollisionLabCanvasRenderer } from '../render/collisionLabCanvasRenderer';
import { CollisionLab } from '../simulations/collisionLab';
import { mountCollisionLabControls } from '../ui/collisionLabControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const collisionLabPlugin: SimulationPlugin = {
  id: 'collision-lab',
  create(context: PluginContext): ActivePlugin {
    const defaults = CollisionLab.getDefaultParams();
    const model = new CollisionLab({
      ...defaults,
      ...context.presetValues,
      mass1: readValue(context.initialValues, 'mass1', 'm1') ?? readValue(context.presetValues, 'mass1') ?? defaults.mass1,
      mass2: readValue(context.initialValues, 'mass2', 'm2') ?? readValue(context.presetValues, 'mass2') ?? defaults.mass2,
      restitution:
        readValue(context.initialValues, 'restitution', 'e') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      wallRestitution:
        readValue(context.initialValues, 'wallRestitution', 'we') ??
        readValue(context.presetValues, 'wallRestitution') ??
        defaults.wallRestitution,
      linearDamping:
        readValue(context.initialValues, 'linearDamping', 'ld') ??
        readValue(context.presetValues, 'linearDamping') ??
        defaults.linearDamping,
      initialX1: readValue(context.initialValues, 'initialX1', 'ix1') ?? defaults.initialX1,
      initialY1: readValue(context.initialValues, 'initialY1', 'iy1') ?? defaults.initialY1,
      initialVx1: readValue(context.initialValues, 'initialVx1', 'ivx1') ?? defaults.initialVx1,
      initialVy1: readValue(context.initialValues, 'initialVy1', 'ivy1') ?? defaults.initialVy1,
      initialX2: readValue(context.initialValues, 'initialX2', 'ix2') ?? defaults.initialX2,
      initialY2: readValue(context.initialValues, 'initialY2', 'iy2') ?? defaults.initialY2,
      initialVx2: readValue(context.initialValues, 'initialVx2', 'ivx2') ?? defaults.initialVx2,
      initialVy2: readValue(context.initialValues, 'initialVy2', 'ivy2') ?? defaults.initialVy2,
    });

    const state = model.getState();
    if (state.length === 8) {
      const keys = ['x1', 'y1', 'vx1', 'vy1', 'x2', 'y2', 'vx2', 'vy2'] as const;
      const next = [...state];
      keys.forEach((k, i) => {
        const v = readValue(context.initialValues, k);
        if (v != null) next[i] = v;
      });
      model.setState(next);
    }

    const renderer = new CollisionLabCanvasRenderer(context.canvas, model);
    let lastImpactSfxAt = 0;
    const IMPACT_TRIGGER = 0.05;
    const IMPACT_COOLDOWN_MS = 45;

    const redraw = () => {
      const world = renderer.getWorldBounds();
      const impact = model.resolveCollisions(world.minX, world.maxX, world.minY, world.maxY);
      if (impact > IMPACT_TRIGGER) {
        const now = performance.now();
        if (now - lastImpactSfxAt > IMPACT_COOLDOWN_MS) {
          const intensity = Math.max(0.35, Math.min(1.6, impact * 0.9));
          context.onSfx('step', intensity);
          lastImpactSfxAt = now;
        }
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x1=${k.b1.x.toFixed(2)} y1=${k.b1.y.toFixed(2)} | x2=${k.b2.x.toFixed(2)} y2=${k.b2.y.toFixed(2)}`,
        `v1=${Math.hypot(k.b1.vx, k.b1.vy).toFixed(2)} | v2=${Math.hypot(k.b2.vx, k.b2.vy).toFixed(2)} | E=${k.kinetic.toFixed(2)}`,
      );

      const p = model.getParams();
      const s = model.getState();
      context.onStateChange({
        mass1: p.mass1,
        mass2: p.mass2,
        restitution: p.restitution,
        wallRestitution: p.wallRestitution,
        linearDamping: p.linearDamping,
        x1: s[0],
        y1: s[1],
        vx1: s[2],
        vy1: s[3],
        x2: s[4],
        y2: s[5],
        vx2: s[6],
        vy2: s[7],
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountCollisionLabControls(context.menuRoot, model, redraw);

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

    type DragTarget = 1 | 2 | null;
    let dragTarget: DragTarget = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragTarget) return;
      const p = toCanvasPoint(event);
      const world = renderer.getWorldBounds();
      const next = renderer.screenToWorld(p.x, p.y);
      const r = dragTarget === 1 ? model.getParams().radius1 : model.getParams().radius2;
      const x = Math.max(world.minX + r, Math.min(world.maxX - r, next.x));
      const y = Math.max(world.minY + r, Math.min(world.maxY - r, next.y));
      model.setBodyState(dragTarget, x, y, 0, 0);
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const balls = renderer.getBallPixels();
      const d1 = Math.hypot(p.x - balls.x1, p.y - balls.y1);
      const d2 = Math.hypot(p.x - balls.x2, p.y - balls.y2);
      if (d1 > balls.r1 && d2 > balls.r2) return;

      dragTarget = d2 <= d1 ? 2 : 1;
      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      context.onSfx('drag-start', 0.95);
      applyDrag(event);
    });

    on(context.canvas, 'pointermove', (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      applyDrag(event);
    });

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      dragTarget = null;
      context.canvas.releasePointerCapture(event.pointerId);
      if (resumeAfterDrag) runner.start();
      context.onSfx('drag-end', 0.85);
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
