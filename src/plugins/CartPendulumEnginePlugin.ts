import { SimulationRunner } from '../core/simulationRunner';
import { CartPendulumEngineCanvasRenderer } from '../render/cartPendulumEngineCanvasRenderer';
import { CartPendulumEngine } from '../simulations/cartPendulumEngine';
import { mountCartPendulumEngineControls } from '../ui/cartPendulumEngineControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const cartPendulumEnginePlugin: SimulationPlugin = {
  id: 'cart-pendulum-engine',
  create(context: PluginContext): ActivePlugin {
    const defaults = CartPendulumEngine.getDefaultParams();
    const model = new CartPendulumEngine({
      ...defaults,
      ...context.presetValues,
      cartMass: readValue(context.initialValues, 'cartMass') ?? readValue(context.presetValues, 'cartMass') ?? defaults.cartMass,
      bobMass: readValue(context.initialValues, 'bobMass') ?? readValue(context.presetValues, 'bobMass') ?? defaults.bobMass,
      length: readValue(context.initialValues, 'length', 'l') ?? readValue(context.presetValues, 'length') ?? defaults.length,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      cartSpring: readValue(context.initialValues, 'cartSpring') ?? readValue(context.presetValues, 'cartSpring') ?? defaults.cartSpring,
      cartDamping: readValue(context.initialValues, 'cartDamping') ?? readValue(context.presetValues, 'cartDamping') ?? defaults.cartDamping,
      linearDamping:
        readValue(context.initialValues, 'linearDamping') ?? readValue(context.presetValues, 'linearDamping') ?? defaults.linearDamping,
      angularDamping:
        readValue(context.initialValues, 'angularDamping') ?? readValue(context.presetValues, 'angularDamping') ?? defaults.angularDamping,
      driveAmplitude:
        readValue(context.initialValues, 'driveAmplitude') ?? readValue(context.presetValues, 'driveAmplitude') ?? defaults.driveAmplitude,
      driveFrequency:
        readValue(context.initialValues, 'driveFrequency') ?? readValue(context.presetValues, 'driveFrequency') ?? defaults.driveFrequency,
      restitution: readValue(context.initialValues, 'restitution') ?? readValue(context.presetValues, 'restitution') ?? defaults.restitution,
      iterations:
        readValue(context.initialValues, 'iterations', 'iter') ?? readValue(context.presetValues, 'iterations') ?? defaults.iterations,
      initialX: readValue(context.initialValues, 'initialX', 'ix') ?? readValue(context.presetValues, 'initialX') ?? defaults.initialX,
      initialTheta:
        readValue(context.initialValues, 'initialTheta', 'th') ?? readValue(context.presetValues, 'initialTheta') ?? defaults.initialTheta,
      initialVx: readValue(context.initialValues, 'initialVx', 'ivx') ?? readValue(context.presetValues, 'initialVx') ?? defaults.initialVx,
      initialOmega:
        readValue(context.initialValues, 'initialOmega', 'iom') ?? readValue(context.presetValues, 'initialOmega') ?? defaults.initialOmega,
    });

    const renderer = new CartPendulumEngineCanvasRenderer(context.canvas, model);

    const redraw = () => {
      const impact = model.resolveConstraints();
      if (impact > 0.08) {
        context.onSfx('step', Math.min(1, impact));
      }

      renderer.draw();
      const k = model.getKinematics();
      context.onPendulumMotion?.(k.omega, k.theta);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x=${k.cartX.toFixed(2)} | th=${k.theta.toFixed(2)}`,
        `vx=${k.cartVx.toFixed(2)} | om=${k.omega.toFixed(2)} | err=${(k.rodErr + k.railErr).toExponential(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        cartMass: p.cartMass,
        bobMass: p.bobMass,
        length: p.length,
        gravity: p.gravity,
        cartSpring: p.cartSpring,
        cartDamping: p.cartDamping,
        linearDamping: p.linearDamping,
        angularDamping: p.angularDamping,
        driveAmplitude: p.driveAmplitude,
        driveFrequency: p.driveFrequency,
        restitution: p.restitution,
        iterations: p.iterations,
        initialX: p.initialX,
        initialTheta: p.initialTheta,
        initialVx: p.initialVx,
        initialOmega: p.initialOmega,
        x: k.cartX,
        theta: k.theta,
        vx: k.cartVx,
        omega: k.omega,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountCartPendulumEngineControls(context.menuRoot, model, redraw);

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

    type DragTarget = 'cart' | 'bob' | null;
    let dragTarget: DragTarget = null;
    let dragPointerId: number | null = null;
    let resumeAfterDrag = false;

    const applyDrag = (event: PointerEvent) => {
      if (!dragTarget) return;
      const p = toCanvasPoint(event);
      if (dragTarget === 'cart') {
        const xCart = Math.max(-2.1, Math.min(2.1, renderer.cartXFromPointer(p.x)));
        model.setCartX(xCart);
        model.setParam('initialX', xCart);
        model.setParam('initialVx', 0);
        model.setParam('initialOmega', 0);
      } else {
        const world = renderer.screenToWorld(p.x, p.y);
        model.setBobPosition(world.x, world.y);
        const k = model.getKinematics();
        model.setParam('initialTheta', k.theta);
        model.setParam('initialVx', 0);
        model.setParam('initialOmega', 0);
      }
      redraw();
    };

    on(context.canvas, 'pointerdown', (event: PointerEvent) => {
      const p = toCanvasPoint(event);
      const cart = renderer.getCartBounds();
      const bob = renderer.getBobPixel();

      const onCart =
        p.x >= cart.cx - cart.width * 0.5 &&
        p.x <= cart.cx + cart.width * 0.5 &&
        p.y >= cart.cy - cart.height * 0.5 &&
        p.y <= cart.cy + cart.height * 0.5;
      const onBob = Math.hypot(p.x - bob.x, p.y - bob.y) <= 24;
      if (!onCart && !onBob) return;

      dragTarget = onBob ? 'bob' : 'cart';
      dragPointerId = event.pointerId;
      context.canvas.setPointerCapture(event.pointerId);
      resumeAfterDrag = runner.isRunning();
      runner.stop();
      context.onSfx('drag-start', 0.9);
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
      context.onSfx('drag-end', 0.82);
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
        context.onPendulumMotion?.(0, 0);
        disposers.forEach((dispose) => dispose());
        context.menuRoot.innerHTML = '';
      },
    };
  },
};
