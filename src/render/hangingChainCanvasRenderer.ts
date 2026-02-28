import { HangingChain } from '../simulations/hangingChain';

export class HangingChainCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private model: HangingChain;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, model: HangingChain) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const state = this.model.getState();
    const params = this.model.getParams();
    const N = params.segments;
    const r = params.nodeRadius;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const world = this.getWorldBounds();
    const worldWidth = world.maxX - world.minX;
    const worldHeight = world.maxY - world.minY;
    const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight);
    
    const worldToScreen = (x: number, y: number) => ({
      x: canvas.width / 2 + x * scale,
      y: canvas.height / 2 + y * scale
    });

    // Draw Links
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < N - 1; i++) {
        const p1 = worldToScreen(state[i * 4], state[i * 4 + 1]);
        const p2 = worldToScreen(state[(i + 1) * 4], state[(i + 1) * 4 + 1]);
        if (i === 0) ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Draw Nodes
    for (let i = 0; i < N; i++) {
        const p = worldToScreen(state[i * 4], state[i * 4 + 1]);
        ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw Floor
    const floorY = world.maxY;
    const screenFloor = worldToScreen(0, floorY);
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, screenFloor.y);
    ctx.lineTo(canvas.width, screenFloor.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  getWorldBounds() {
    return { minX: -2, maxX: 2, minY: -2, maxY: 1.5 };
  }

  screenToWorld(sx: number, sy: number) {
    const world = this.getWorldBounds();
    const worldWidth = world.maxX - world.minX;
    const worldHeight = world.maxY - world.minY;
    const scale = Math.min(this.canvas.width / worldWidth, this.canvas.height / worldHeight);
    return {
      x: (sx - this.canvas.width / 2) / scale,
      y: (sy - this.canvas.height / 2) / scale
    };
  }

  getNodePixels() {
    const state = this.model.getState();
    const params = this.model.getParams();
    const N = params.segments;
    const r = params.nodeRadius;
    const world = this.getWorldBounds();
    const scale = Math.min(this.canvas.width / (world.maxX - world.minX), this.canvas.height / (world.maxY - world.minY));
    
    return Array.from({ length: N }, (_, i) => {
        const x = this.canvas.width / 2 + state[i * 4] * scale;
        const y = this.canvas.height / 2 + state[i * 4 + 1] * scale;
        return { x, y, r: r * scale };
    });
  }
}
