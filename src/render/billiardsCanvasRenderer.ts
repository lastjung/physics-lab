import { Billiards } from '../simulations/billiards';

export interface BilliardsBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class BilliardsCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly colors = ['#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: Billiards) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const b = this.getWorldBounds();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f5132';
    ctx.fillRect(0, 0, w, h);

    const topLeft = this.worldToScreen(b.minX, b.maxY);
    const bottomRight = this.worldToScreen(b.maxX, b.minY);
    ctx.fillStyle = '#166534';
    ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 12;
    ctx.strokeRect(topLeft.x - 2, topLeft.y - 2, bottomRight.x - topLeft.x + 4, bottomRight.y - topLeft.y + 4);

    const balls = this.model.getKinematics().balls;
    const r = this.model.getParams().radius * this.getScale();
    balls.forEach((ball, i) => {
      const p = this.worldToScreen(ball.x, ball.y);
      ctx.fillStyle = this.colors[i] ?? '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Billiards - drag any ball', 18, h - 24);
  }

  getWorldBounds(): BilliardsBounds {
    return { minX: -2.2, maxX: 2.2, minY: -1.05, maxY: 1.05 };
  }

  getBallPixels(): Array<{ x: number; y: number; r: number }> {
    const balls = this.model.getKinematics().balls;
    const r = this.model.getParams().radius * this.getScale();
    return balls.map((b) => {
      const p = this.worldToScreen(b.x, b.y);
      return { x: p.x, y: p.y, r };
    });
  }

  screenToWorld(px: number, py: number): { x: number; y: number } {
    const c = this.getCenter();
    const s = this.getScale();
    return { x: (px - c.x) / s, y: -(py - c.y) / s };
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    const c = this.getCenter();
    const s = this.getScale();
    return { x: c.x + x * s, y: c.y - y * s };
  }

  private getCenter(): { x: number; y: number } {
    return { x: this.canvas.width * 0.5, y: this.canvas.height * 0.54 };
  }

  private getScale(): number {
    const b = this.getWorldBounds();
    const sx = (this.canvas.width - 80) / (b.maxX - b.minX);
    const sy = (this.canvas.height - 110) / (b.maxY - b.minY);
    return Math.max(1, Math.min(sx, sy));
  }
}
