import { NewtonsCradle } from '../simulations/newtonsCradle';

export interface CradleSceneBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class NewtonsCradleCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ballColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'];

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: NewtonsCradle) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const bounds = this.getWorldBounds();
    const scale = this.getScale(bounds);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const topLeft = this.worldToScreen(bounds.minX, bounds.maxY);
    const boardW = (bounds.maxX - bounds.minX) * scale;
    const boardH = (bounds.maxY - bounds.minY) * scale;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.strokeRect(topLeft.x, topLeft.y, boardW, boardH);

    const k = this.model.getKinematics();
    const p = this.model.getParams();
    const anchorX = this.model.getAnchorX();
    const anchorY = 0.9;
    const length = 0.92;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    for (let i = 0; i < anchorX.length; i += 1) {
      const d = k.x[i];
      const bobX = anchorX[i] + d;
      const bobY = anchorY - Math.sqrt(Math.max(0.2, length * length - d * d));
      const a = this.worldToScreen(anchorX[i], anchorY);
      const b = this.worldToScreen(bobX, bobY);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.fillStyle = this.ballColors[i] ?? '#0ea5e9';
      ctx.beginPath();
      ctx.arc(b.x, b.y, p.radius * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    const beamL = this.worldToScreen(anchorX[0] - 0.25, anchorY);
    const beamR = this.worldToScreen(anchorX[anchorX.length - 1] + 0.25, anchorY);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(beamL.x, beamL.y);
    ctx.lineTo(beamR.x, beamR.y);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Newton\'s Cradle - drag left or right end ball', 18, h - 24);
  }

  getWorldBounds(): CradleSceneBounds {
    return {
      minX: -2.55,
      maxX: 2.55,
      minY: -1.55,
      maxY: 1.18,
    };
  }

  getBallPixels(): Array<{ x: number; y: number; r: number }> {
    const p = this.model.getParams();
    const k = this.model.getKinematics();
    const anchorX = this.model.getAnchorX();
    const anchorY = 0.9;
    const length = 0.92;
    const scale = this.getScale(this.getWorldBounds());

    return anchorX.map((ax, i) => {
      const d = k.x[i];
      const worldX = ax + d;
      const worldY = anchorY - Math.sqrt(Math.max(0.2, length * length - d * d));
      const s = this.worldToScreen(worldX, worldY);
      return { x: s.x, y: s.y, r: p.radius * scale };
    });
  }

  displacementFromPointer(index: number, px: number): number {
    const world = this.screenToWorld(px, 0);
    const anchor = this.model.getAnchorX()[index] ?? 0;
    return world.x - anchor;
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    const bounds = this.getWorldBounds();
    const scale = this.getScale(bounds);
    const padX = 30;
    const padTop = 24;
    return {
      x: padX + (x - bounds.minX) * scale,
      y: padTop + (bounds.maxY - y) * scale,
    };
  }

  private screenToWorld(px: number, py: number): { x: number; y: number } {
    const bounds = this.getWorldBounds();
    const scale = this.getScale(bounds);
    const padX = 30;
    const padTop = 24;
    return {
      x: bounds.minX + (px - padX) / scale,
      y: bounds.maxY - (py - padTop) / scale,
    };
  }

  private getScale(bounds: CradleSceneBounds): number {
    const worldW = bounds.maxX - bounds.minX;
    const worldH = bounds.maxY - bounds.minY;
    const sx = (this.canvas.width - 60) / worldW;
    const sy = (this.canvas.height - 64) / worldH;
    return Math.max(1, Math.min(sx, sy));
  }
}
