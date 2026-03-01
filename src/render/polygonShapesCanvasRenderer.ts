import { PolygonShapes } from '../simulations/polygonShapes';

export interface PolygonWorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class PolygonShapesCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: PolygonShapes) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getWorldBounds(): PolygonWorldBounds {
    return { minX: -2.3, maxX: 2.3, minY: -1.05, maxY: 1.45 };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getWorldBounds();
    const sx = (w - 60) / (b.maxX - b.minX);
    const sy = (h - 70) / (b.maxY - b.minY);
    const s = Math.min(sx, sy);
    return { x: 30 + (x - b.minX) * s, y: 20 + (b.maxY - y) * s };
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const bounds = this.getWorldBounds();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const a = this.worldToScreen(bounds.minX, bounds.maxY);
    const b = this.worldToScreen(bounds.maxX, bounds.minY);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);

    const bodies = this.model.getBodies();
    bodies.forEach((body, i) => {
      const verts = body.worldVertices ?? [];
      if (verts.length < 3) return;
      const hue = (i * 68) % 360;
      ctx.fillStyle = `hsl(${hue} 65% 57%)`;
      ctx.strokeStyle = `hsl(${hue} 70% 28%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      verts.forEach((v, idx) => {
        const p = this.worldToScreen(v.x, v.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Polygon SAT collision demo', 18, h - 16);
  }
}
