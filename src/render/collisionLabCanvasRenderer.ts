import { CollisionLab } from '../simulations/collisionLab';

export interface CollisionSceneBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface CollisionSceneMetrics {
  centerX: number;
  centerY: number;
  scale: number;
}

export class CollisionLabCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CollisionLab) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const { b1, b2 } = this.model.getKinematics();
    const m = this.getSceneMetrics();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    const world = this.getWorldBounds();
    const topLeft = this.worldToScreen(world.minX, world.maxY);
    const sizeW = (world.maxX - world.minX) * m.scale;
    const sizeH = (world.maxY - world.minY) * m.scale;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(topLeft.x, topLeft.y, sizeW, sizeH);

    this.drawBall(b1.x, b1.y, b1.radius, '#2563eb');
    this.drawBall(b2.x, b2.y, b2.radius, '#06b6d4');

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Drag each ball to set release point', 18, h - 24);
  }

  getWorldBounds(): CollisionSceneBounds {
    return {
      minX: -1.6,
      maxX: 1.6,
      minY: -1.0,
      maxY: 1.0,
    };
  }

  getBallPixels(): { x1: number; y1: number; r1: number; x2: number; y2: number; r2: number } {
    const { b1, b2 } = this.model.getKinematics();
    const p1 = this.worldToScreen(b1.x, b1.y);
    const p2 = this.worldToScreen(b2.x, b2.y);
    const m = this.getSceneMetrics();
    return {
      x1: p1.x,
      y1: p1.y,
      r1: b1.radius * m.scale,
      x2: p2.x,
      y2: p2.y,
      r2: b2.radius * m.scale,
    };
  }

  screenToWorld(px: number, py: number): { x: number; y: number } {
    const { centerX, centerY, scale } = this.getSceneMetrics();
    return {
      x: (px - centerX) / scale,
      y: -(py - centerY) / scale,
    };
  }

  private getSceneMetrics(): CollisionSceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      centerX: w * 0.5,
      centerY: h * 0.53,
      scale: Math.min(w, h) * 0.24,
    };
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    const { centerX, centerY, scale } = this.getSceneMetrics();
    return {
      x: centerX + x * scale,
      y: centerY - y * scale,
    };
  }

  private drawBall(x: number, y: number, radius: number, color: string): void {
    const { ctx } = this;
    const p = this.worldToScreen(x, y);
    const m = this.getSceneMetrics();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * m.scale, 0, Math.PI * 2);
    ctx.fill();
  }
}
