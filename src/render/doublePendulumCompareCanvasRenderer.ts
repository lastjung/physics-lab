import { DoublePendulumCompare } from '../simulations/doublePendulumCompare';

export class DoublePendulumCompareCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private model: DoublePendulumCompare;
  private canvas: HTMLCanvasElement;
  private trailA: {x: number, y: number}[] = [];
  private trailB: {x: number, y: number}[] = [];
  public showTrails = true;

  constructor(canvas: HTMLCanvasElement, model: DoublePendulumCompare) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const pos = this.model.getPositions();
    const params = this.model.getParams();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = canvas.height * 0.22;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.45;

    const toScreen = (x: number, y: number) => ({
      x: centerX + x * scale,
      y: centerY + y * scale
    });

    // Update trails
    const pA = toScreen(pos.a.x2, pos.a.y2);
    const pB = toScreen(pos.b.x2, pos.b.y2);

    this.trailA.push(pA);
    this.trailB.push(pB);
    if (this.trailA.length > params.trailLength) this.trailA.shift();
    if (this.trailB.length > params.trailLength) this.trailB.shift();

    if (this.model.getTime() < 0.02) {
        this.trailA = [];
        this.trailB = [];
    }

    // Draw Trails
    if (this.showTrails) {
      this.drawTrail(this.trailA, 'rgba(56, 189, 248, 0.4)');
      this.drawTrail(this.trailB, 'rgba(239, 68, 68, 0.4)');
    }

    // Draw Pendulum A (Sky Blue)
    this.drawPendulum(pos.a, '#0ea5e9', 'rgba(14, 165, 233, 0.2)');
    // Draw Pendulum B (Red)
    this.drawPendulum(pos.b, '#ef4444', 'rgba(239, 68, 68, 0.2)');

    // Origin
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTrail(trail: {x: number, y: number}[], color: string) {
    if (trail.length < 2) return;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      this.ctx.lineTo(trail[i].x, trail[i].y);
    }
    this.ctx.stroke();
  }

  private drawPendulum(pos: any, color: string, glow: string) {
    const { ctx, canvas } = this;
    const scale = canvas.height * 0.22;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.45;

    const toScreen = (x: number, y: number) => ({
      x: centerX + x * scale,
      y: centerY + y * scale
    });

    const p1 = toScreen(pos.x1, pos.y1);
    const p2 = toScreen(pos.x2, pos.y2);

    // Rods
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Joints/Masses
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer mass with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  clearTrails() {
    this.trailA = [];
    this.trailB = [];
  }

  screenToWorld(sx: number, sy: number) {
    const scale = this.canvas.height * 0.22;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height * 0.45;
    return {
      x: (sx - centerX) / scale,
      y: (sy - centerY) / scale
    };
  }
}
