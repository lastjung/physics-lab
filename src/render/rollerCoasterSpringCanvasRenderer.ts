import { RollerCoasterSpring } from '../simulations/rollerCoasterSpring';

export interface CoasterSpringBounds {
  minX: number;
  maxX: number;
}

export class RollerCoasterSpringCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: RollerCoasterSpring) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getBounds(): CoasterSpringBounds {
    return { minX: -2.4, maxX: 2.4 };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getBounds();
    const minY = -1.4;
    const maxY = 1.4;
    const sx = (w - 70) / (b.maxX - b.minX);
    const sy = (h - 90) / (maxY - minY);
    const s = Math.min(sx, sy);
    return { x: 35 + (x - b.minX) * s, y: 28 + (maxY - y) * s };
  }

  xFromPointer(px: number): number {
    const w = this.canvas.width;
    const b = this.getBounds();
    const sx = (w - 70) / (b.maxX - b.minX);
    return b.minX + (px - 35) / sx;
  }

  carPixel() {
    const k = this.model.getKinematics();
    const p = this.worldToScreen(k.x, k.y);
    return { ...p, r: 16 };
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const b = this.getBounds();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const samples = 180;
    for (let i = 0; i <= samples; i += 1) {
      const x = b.minX + ((b.maxX - b.minX) * i) / samples;
      const y = this.model.trackY(x);
      const p = this.worldToScreen(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const k = this.model.getKinematics();
    const rest = this.worldToScreen(this.model.getParams().springRestX, this.model.trackY(this.model.getParams().springRestX));
    const car = this.worldToScreen(k.x, k.y);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rest.x, rest.y);
    ctx.lineTo(car.x, car.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(rest.x, rest.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(car.x, car.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Spring-coupled coaster', 18, h - 22);
  }
}
