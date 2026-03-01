import { DoublePendulumEngine } from '../simulations/doublePendulumEngine';

export interface DoubleEngineSceneMetrics {
  originX: number;
  originY: number;
  pxPerMeter: number;
}

export class DoublePendulumEngineCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: DoublePendulumEngine) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getSceneMetrics(): DoubleEngineSceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.model.getParams();
    const reach = Math.max(0.4, p.length1 + p.length2);
    const originY = h * 0.28;
    const bottomMargin = h * 0.12;
    const horizontalMargin = w * 0.12;
    const maxScaleX = (w * 0.5 - horizontalMargin) / reach;
    const maxScaleYDown = (h - originY - bottomMargin) / reach;
    // Allow partial over-the-top rotation without shrinking the whole scene too much.
    const maxScaleYUp = originY / (reach * 0.65);
    const preferredScale = Math.min(w, h) * 0.24;
    const pxPerMeter = Math.max(52, Math.min(preferredScale, maxScaleX, maxScaleYDown, maxScaleYUp));
    return {
      originX: w * 0.5,
      originY,
      pxPerMeter,
    };
  }

  worldToScreen(x: number, y: number) {
    const m = this.getSceneMetrics();
    const anchor = this.model.getAnchor();
    return {
      x: m.originX + (x - anchor.x) * m.pxPerMeter,
      y: m.originY + (y - anchor.y) * m.pxPerMeter,
    };
  }

  screenToWorld(px: number, py: number) {
    const m = this.getSceneMetrics();
    const anchor = this.model.getAnchor();
    return {
      x: anchor.x + (px - m.originX) / m.pxPerMeter,
      y: anchor.y + (py - m.originY) / m.pxPerMeter,
    };
  }

  getBobPixelPositions() {
    const k = this.model.getKinematics();
    const p1 = this.worldToScreen(k.x1, k.y1);
    const p2 = this.worldToScreen(k.x2, k.y2);
    return {
      p1x: p1.x,
      p1y: p1.y,
      p2x: p2.x,
      p2y: p2.y,
    };
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const m = this.getSceneMetrics();

    const k = this.model.getKinematics();
    const anchor = this.model.getAnchor();
    const ap = this.worldToScreen(anchor.x, anchor.y);
    const p1 = this.worldToScreen(k.x1, k.y1);
    const p2 = this.worldToScreen(k.x2, k.y2);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ap.x, ap.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ap.x, ap.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(
      `Engine Joint DP | th1 ${(k.theta1 * 180 / Math.PI).toFixed(1)} deg | th2 ${(k.theta2 * 180 / Math.PI).toFixed(1)} deg`,
      16,
      h - 22,
    );

    ctx.fillStyle = '#64748b';
    ctx.fillText(`lenErr ${(k.lenErr1 + k.lenErr2).toExponential(2)}`, w - 210, 28);
  }
}
