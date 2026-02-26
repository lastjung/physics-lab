import { RollerCoaster } from '../simulations/rollerCoaster';

export interface CoasterBounds {
  minX: number;
  maxX: number;
}

export class RollerCoasterCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: RollerCoaster) {
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
    ctx.fillStyle = '#ecfeff';
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
    const car = this.worldToScreen(k.x, k.y);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(car.x, car.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#164e63';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Drag car along track', 18, h - 24);
  }

  getBounds(): CoasterBounds {
    return {
      minX: -2.4,
      maxX: 2.4,
    };
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

  carPixel(): { x: number; y: number; r: number } {
    const k = this.model.getKinematics();
    const p = this.worldToScreen(k.x, k.y);
    return { ...p, r: 16 };
  }
}
