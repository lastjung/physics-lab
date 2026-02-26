import { CartPendulum } from '../simulations/cartPendulum';

export class CartPendulumCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CartPendulum) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const k = this.model.getKinematics();

    const cx = w * 0.5;
    const railY = h * 0.58;
    const scaleX = w * 0.18;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, railY + 30);
    ctx.lineTo(w - 40, railY + 30);
    ctx.stroke();

    const cartX = cx + k.x * scaleX;
    const cartW = 120;
    const cartH = 38;
    const cartTop = railY - cartH * 0.5;

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cartX - cartW * 0.5, cartTop, cartW, cartH);

    const wheelR = 10;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cartX - 32, railY + 26, wheelR, 0, Math.PI * 2);
    ctx.arc(cartX + 32, railY + 26, wheelR, 0, Math.PI * 2);
    ctx.fill();

    const pivotX = cartX;
    const pivotY = cartTop;
    const len = this.model.getParams().length * 170;
    const bobX = pivotX + Math.sin(k.theta) * len;
    const bobY = pivotY + Math.cos(k.theta) * len;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Drag cart or bob', 18, h - 24);
  }

  getCartBounds(): { cx: number; cy: number; width: number; height: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const k = this.model.getKinematics();
    const cx = w * 0.5 + k.x * (w * 0.18);
    const cy = h * 0.58;
    return { cx, cy, width: 120, height: 38 };
  }

  getBobPixel(): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const k = this.model.getKinematics();
    const pivotX = w * 0.5 + k.x * (w * 0.18);
    const pivotY = h * 0.58 - 19;
    const len = this.model.getParams().length * 170;
    return {
      x: pivotX + Math.sin(k.theta) * len,
      y: pivotY + Math.cos(k.theta) * len,
    };
  }

  cartXFromPointer(px: number): number {
    const w = this.canvas.width;
    return (px - w * 0.5) / (w * 0.18);
  }

  thetaFromPointer(px: number, py: number): number {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const k = this.model.getKinematics();
    const pivotX = w * 0.5 + k.x * (w * 0.18);
    const pivotY = h * 0.58 - 19;
    return Math.atan2(px - pivotX, py - pivotY);
  }
}
