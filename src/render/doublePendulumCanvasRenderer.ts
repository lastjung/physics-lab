import { DoublePendulum } from '../simulations/doublePendulum';

export interface DoubleSceneMetrics {
  originX: number;
  originY: number;
  pxPerMeter: number;
}

export class DoublePendulumCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: DoublePendulum) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    const { originX, originY, pxPerMeter } = this.getSceneMetrics();

    const { x1, y1, x2, y2, theta1, theta2 } = this.model.getKinematics();
    const p1x = originX + x1 * pxPerMeter;
    const p1y = originY + y1 * pxPerMeter;
    const p2x = originX + x2 * pxPerMeter;
    const p2y = originY + y2 * pxPerMeter;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();

    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(p1x, p1y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(p2x, p2y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(originX, originY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(`theta1 ${(theta1 * 180 / Math.PI).toFixed(1)} deg | theta2 ${(theta2 * 180 / Math.PI).toFixed(1)} deg`, 16, h - 22);
  }

  getSceneMetrics(): DoubleSceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      originX: w * 0.5,
      originY: 88,
      pxPerMeter: Math.min(w, h) * 0.2,
    };
  }

  getBobPixelPositions(): { p1x: number; p1y: number; p2x: number; p2y: number } {
    const { originX, originY, pxPerMeter } = this.getSceneMetrics();
    const { x1, y1, x2, y2 } = this.model.getKinematics();
    return {
      p1x: originX + x1 * pxPerMeter,
      p1y: originY + y1 * pxPerMeter,
      p2x: originX + x2 * pxPerMeter,
      p2y: originY + y2 * pxPerMeter,
    };
  }
}
