import { CollidingBlocks } from '../simulations/collidingBlocks';

export interface BlocksWorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class CollidingBlocksCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CollidingBlocks) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getWorldBounds(): BlocksWorldBounds {
    return { minX: -2.3, maxX: 2.3, minY: -1.05, maxY: 1.35 };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getWorldBounds();
    const sx = (w - 60) / (b.maxX - b.minX);
    const sy = (h - 70) / (b.maxY - b.minY);
    const s = Math.min(sx, sy);
    return {
      x: 30 + (x - b.minX) * s,
      y: 20 + (b.maxY - y) * s,
    };
  }

  screenToWorld(px: number, py: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getWorldBounds();
    const sx = (w - 60) / (b.maxX - b.minX);
    const sy = (h - 70) / (b.maxY - b.minY);
    const s = Math.min(sx, sy);
    return {
      x: b.minX + (px - 30) / s,
      y: b.maxY - (py - 20) / s,
    };
  }

  getBlockPixels() {
    const blocks = this.model.getBlocks();
    return blocks.map((b) => {
      const p = this.worldToScreen(b.x, b.y);
      const p2 = this.worldToScreen(b.x + b.half, b.y);
      const halfPx = Math.abs(p2.x - p.x);
      return {
        id: b.id,
        x: p.x,
        y: p.y,
        halfPx,
      };
    });
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

    const blocks = this.model.getBlocks();
    blocks.forEach((block, i) => {
      const p = this.worldToScreen(block.x, block.y);
      const p2 = this.worldToScreen(block.x + block.half, block.y);
      const halfPx = Math.abs(p2.x - p.x);
      const hue = (i * 37) % 360;
      ctx.fillStyle = `hsl(${hue} 70% 55%)`;
      ctx.strokeStyle = `hsl(${hue} 80% 30%)`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(p.x - halfPx, p.y - halfPx, halfPx * 2, halfPx * 2);
      ctx.strokeRect(p.x - halfPx, p.y - halfPx, halfPx * 2, halfPx * 2);
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Drag blocks | Shuffle for chaos', 18, h - 16);
  }
}
