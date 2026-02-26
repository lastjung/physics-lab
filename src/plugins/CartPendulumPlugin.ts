import { SimulationRunner } from '../core/simulationRunner';
import { CartPendulumCanvasRenderer } from '../render/cartPendulumCanvasRenderer';
import { CartPendulum } from '../simulations/cartPendulum';
import { mountCartPendulumControls } from '../ui/cartPendulumControls';
import type { ActivePlugin, PluginContext, SimulationPlugin } from './types';

const readValue = (source: Record<string, number>, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
};

export const cartPendulumPlugin: SimulationPlugin = {
  id: 'cart-pendulum',
  create(context: PluginContext): ActivePlugin {
    const defaults = CartPendulum.getDefaultParams();
    const model = new CartPendulum({
      ...defaults,
      ...context.presetValues,
      cartMass: readValue(context.initialValues, 'cartMass') ?? readValue(context.presetValues, 'cartMass') ?? defaults.cartMass,
      bobMass: readValue(context.initialValues, 'bobMass') ?? readValue(context.presetValues, 'bobMass') ?? defaults.bobMass,
      length: readValue(context.initialValues, 'length', 'l') ?? readValue(context.presetValues, 'length') ?? defaults.length,
      gravity: readValue(context.initialValues, 'gravity', 'g') ?? readValue(context.presetValues, 'gravity') ?? defaults.gravity,
      cartSpring: readValue(context.initialValues, 'cartSpring') ?? readValue(context.presetValues, 'cartSpring') ?? defaults.cartSpring,
      cartDamping: readValue(context.initialValues, 'cartDamping') ?? readValue(context.presetValues, 'cartDamping') ?? defaults.cartDamping,
      pendulumDamping:
        readValue(context.initialValues, 'pendulumDamping') ?? readValue(context.presetValues, 'pendulumDamping') ?? defaults.pendulumDamping,
      driveAmplitude:
        readValue(context.initialValues, 'driveAmplitude') ?? readValue(context.presetValues, 'driveAmplitude') ?? defaults.driveAmplitude,
      driveFrequency:
        readValue(context.initialValues, 'driveFrequency') ?? readValue(context.presetValues, 'driveFrequency') ?? defaults.driveFrequency,
      initialX: readValue(context.initialValues, 'initialX', 'ix') ?? readValue(context.presetValues, 'initialX') ?? defaults.initialX,
      initialTheta:
        readValue(context.initialValues, 'initialTheta', 'th') ?? readValue(context.presetValues, 'initialTheta') ?? defaults.initialTheta,
      initialVx: readValue(context.initialValues, 'initialVx', 'ivx') ?? readValue(context.presetValues, 'initialVx') ?? defaults.initialVx,
      initialOmega:
        readValue(context.initialValues, 'initialOmega', 'iom') ?? readValue(context.presetValues, 'initialOmega') ?? defaults.initialOmega,
    });

    const x = readValue(context.initialValues, 'x');
    const theta = readValue(context.initialValues, 'theta', 'th');
    const vx = readValue(context.initialValues, 'vx');
    const omega = readValue(context.initialValues, 'omega', 'om');
    if (x != null && theta != null && vx != null && omega != null) {
      model.setState([x, theta, vx, omega]);
      model.setParam('initialX', x);
      model.setParam('initialTheta', theta);
      model.setParam('initialVx', vx);
      model.setParam('initialOmega', omega);
    }

    const renderer = new CartPendulumCanvasRenderer(context.canvas, model);

    const redraw = () => {
      renderer.draw();
      const k = model.getKinematics();
      context.onPendulumMotion?.(k.omega, k.theta);
      context.onStats(
        `t=${model.getTime().toFixed(2)}s | x=${k.x.toFixed(2)} | th=${k.theta.toFixed(2)}`,
        `vx=${k.vx.toFixed(2)} | om=${k.omega.toFixed(2)} | E=${k.total.toFixed(2)}`,
      );

      const p = model.getParams();
      context.onStateChange({
        cartMass: p.cartMass,
        bobMass: p.bobMass,
        length: p.length,
        gravity: p.gravity,
        cartSpring: p.cartSpring,
        cartDamping: p.cartDamping,
        pendulumDamping: p.pendulumDamping,
        driveAmplitude: p.driveAmplitude,
        driveFrequency: p.driveFrequency,
        initialX: p.initialX,
        initialTheta: p.initialTheta,
        initialVx: p.initialVx,
        initialOmega: p.initialOmega,
        x: k.x,
        theta: k.theta,
        vx: k.vx,
        omega: k.omega,
      });
    };

    const runner = new SimulationRunner(model, redraw);
    mountCartPendulumControls(context.menuRoot, model, redraw);

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
      const [, theta] = model.getState();
      if (dragTarget === 'cart') {
        const xCart = Math.max(-2.1, Math.min(2.1, renderer.cartXFromPointer(p.x)));
        model.setState([xCart, theta, 0, 0]);
        model.setParam('initialX', xCart);
        model.setParam('initialVx', 0);
        model.setParam('initialOmega', 0);
      } else {
        const nextTheta = renderer.thetaFromPointer(p.x, p.y);
        const [x] = model.getState();
        model.setState([x, nextTheta, 0, 0]);
        model.setParam('initialTheta', nextTheta);
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
      const onBob = Math.hypot(p.x - bob.x, p.y - bob.y) <= 22;
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
      context.onSfx('drag-end', 0.8);
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
