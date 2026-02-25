import { DampedPendulum } from '../simulations/dampedPendulum';

export interface SceneMetrics {
  originX: number;
  originY: number;
  pixelsPerMeter: number;
}

export class PendulumCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: DampedPendulum) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const { originX, originY, pixelsPerMeter } = this.getSceneMetrics();

    const { x, y, theta } = this.model.getKinematics();
    const bobX = originX + x * pixelsPerMeter;
    const bobY = originY + y * pixelsPerMeter;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(originX, originY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(`angle: ${(theta * 180 / Math.PI).toFixed(1)} deg`, 18, h - 28);
  }

  getSceneMetrics(): SceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      originX: w / 2,
      originY: 80,
      pixelsPerMeter: Math.min(w, h) * 0.28,
    };
  }

  getBobPixelPosition(): { x: number; y: number } {
    const { originX, originY, pixelsPerMeter } = this.getSceneMetrics();
    const { x, y } = this.model.getKinematics();
    return {
      x: originX + x * pixelsPerMeter,
      y: originY + y * pixelsPerMeter,
    };
  }
}
