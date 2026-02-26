import { RollerCoasterTwoBalls } from '../simulations/rollerCoasterTwoBalls';

export interface Coaster2Bounds {
  minX: number;
  maxX: number;
}

export class RollerCoasterTwoBallsCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: RollerCoasterTwoBalls) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const bounds = this.getBounds();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#155e75';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const samples = 180;
    for (let i = 0; i <= samples; i += 1) {
      const x = bounds.minX + ((bounds.maxX - bounds.minX) * i) / samples;
      const y = this.model.trackY(x);
      const p = this.worldToScreen(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const k = this.model.getKinematics();
    const p1 = this.worldToScreen(k.x1, k.y1);
    const p2 = this.worldToScreen(k.x2, k.y2);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#164e63';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Drag either ball', 18, h - 24);
  }

  getBounds(): Coaster2Bounds {
    return { minX: -2.4, maxX: 2.4 };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getBounds();
    const minY = -1.35;
    const maxY = 1.35;
    const sx = (w - 70) / (b.maxX - b.minX);
    const sy = (h - 90) / (maxY - minY);
    const scale = Math.min(sx, sy);
    return {
      x: 35 + (x - b.minX) * scale,
      y: 28 + (maxY - y) * scale,
    };
  }

  xFromPointer(px: number): number {
    const w = this.canvas.width;
    const b = this.getBounds();
    const sx = (w - 70) / (b.maxX - b.minX);
    return b.minX + (px - 35) / sx;
  }

  ballPixels(): { x1: number; y1: number; x2: number; y2: number; r: number } {
    const k = this.model.getKinematics();
    const p1 = this.worldToScreen(k.x1, k.y1);
    const p2 = this.worldToScreen(k.x2, k.y2);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, r: 15 };
  }
}
