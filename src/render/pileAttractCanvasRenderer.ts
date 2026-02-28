import { PileAttract } from '../simulations/pileAttract';

export class PileAttractCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private model: PileAttract;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, model: PileAttract) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const state = this.model.getState();
    const params = this.model.getParams();
    const N = params.particleCount;
    const r = params.nodeRadius;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const world = this.getWorldBounds();
    const scale = Math.min(canvas.width / (world.maxX - world.minX), canvas.height / (world.maxY - world.minY));
    
    const worldToScreen = (x: number, y: number) => ({
      x: canvas.width / 2 + x * scale,
      y: canvas.height / 2 + y * scale
    });

    // Draw Attractor
    const attPos = worldToScreen(params.attractorX, params.attractorY);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.arc(attPos.x, attPos.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(attPos.x, attPos.y, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Particles
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    for (let i = 0; i < N; i++) {
      const idx = i * 4;
      const p = worldToScreen(state[idx], state[idx + 1]);
      
      // Use Golden Angle (137.5 degrees) for hue distribution
      const hue = (i * 137.5) % 360;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw Boundary
    if (params.boundaryMode === 'bounce') {
      const minP = worldToScreen(world.minX, world.minY);
      const maxP = worldToScreen(world.maxX, world.maxY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minP.x, minP.y, maxP.x - minP.x, maxP.y - minP.y);
      ctx.setLineDash([]);
    }
  }

  getWorldBounds() {
    return { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 };
  }

  screenToWorld(sx: number, sy: number) {
    const world = this.getWorldBounds();
    const scale = Math.min(this.canvas.width / (world.maxX - world.minX), this.canvas.height / (world.maxY - world.minY));
    return {
      x: (sx - this.canvas.width / 2) / scale,
      y: (sy - this.canvas.height / 2) / scale
    };
  }
}
