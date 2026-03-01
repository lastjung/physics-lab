import { CartPendulumEngine } from '../simulations/cartPendulumEngine';

export interface CartPendulumEngineSceneMetrics {
  originX: number;
  originY: number;
  pxPerMeter: number;
}

export class CartPendulumEngineCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CartPendulumEngine) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getSceneMetrics(): CartPendulumEngineSceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      originX: w * 0.5,
      originY: h * 0.3,
      pxPerMeter: Math.min(w, h) * 0.22,
    };
  }

  worldToScreen(x: number, y: number) {
    const m = this.getSceneMetrics();
    return {
      x: m.originX + x * m.pxPerMeter,
      y: m.originY + y * m.pxPerMeter,
    };
  }

  screenToWorld(px: number, py: number) {
    const m = this.getSceneMetrics();
    return {
      x: (px - m.originX) / m.pxPerMeter,
      y: (py - m.originY) / m.pxPerMeter,
    };
  }

  getCartBounds(): { cx: number; cy: number; width: number; height: number } {
    const k = this.model.getKinematics();
    const c = this.worldToScreen(k.cartX, k.cartY);
    const m = this.getSceneMetrics();
    return {
      cx: c.x,
      cy: c.y,
      width: m.pxPerMeter * 0.48,
      height: m.pxPerMeter * 0.2,
    };
  }

  getBobPixel(): { x: number; y: number } {
    const k = this.model.getKinematics();
    return this.worldToScreen(k.bobX, k.bobY);
  }

  cartXFromPointer(px: number): number {
    return this.screenToWorld(px, 0).x;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const m = this.getSceneMetrics();
    const p = this.model.getParams();
    const k = this.model.getKinematics();

    const rail = this.worldToScreen(0, k.cartY);
    const cart = this.worldToScreen(k.cartX, k.cartY);
    const pivot = this.worldToScreen(k.pivotX, k.pivotY);
    const bob = this.worldToScreen(k.bobX, k.bobY);
    const bobR = Math.max(12, m.pxPerMeter * (0.065 * Math.sqrt(Math.max(0.05, p.bobMass))));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rail.x - m.pxPerMeter * 2.3, rail.y + 24);
    ctx.lineTo(rail.x + m.pxPerMeter * 2.3, rail.y + 24);
    ctx.stroke();

    const cartW = m.pxPerMeter * 0.48;
    const cartH = m.pxPerMeter * 0.2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cart.x - cartW * 0.5, cart.y - cartH * 0.5, cartW, cartH);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cart.x - cartW * 0.28, cart.y + cartH * 0.55, 9, 0, Math.PI * 2);
    ctx.arc(cart.x + cartW * 0.28, cart.y + cartH * 0.55, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, bobR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Engine Cart + Pendulum | drag cart/bob', 16, h - 24);

    ctx.fillStyle = '#64748b';
    ctx.fillText(`rodErr ${k.rodErr.toExponential(1)}`, w - 180, 28);
  }
}
