import { CoupledSpring } from '../simulations/coupledSpring';

interface CoupledSceneMetrics {
  y: number;
  scale: number;
  base1: number;
  base2: number;
}

export class CoupledSpringCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CoupledSpring) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const { y, scale, base1, base2 } = this.getSceneMetrics();

    const { x1, x2 } = this.model.getKinematics();
    const wallX = 80;

    const m1x = base1 + x1 * scale;
    const m2x = base2 + x2 * scale;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#475569';
    ctx.fillRect(wallX - 20, 100, 20, h - 190);

    const drawSpring = (xStart: number, xEnd: number, amp: number) => {
      const coils = 12;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      for (let i = 1; i <= coils; i += 1) {
        const t = i / coils;
        const x = xStart + (xEnd - xStart) * t;
        const yy = y + (i % 2 === 0 ? -amp : amp);
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(xEnd, y);
      ctx.stroke();
    };

    drawSpring(wallX, m1x - 26, 10);
    drawSpring(m1x + 26, m2x - 26, 8);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(m1x - 26, y - 22, 52, 44);
 
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(m2x - 26, y - 22, 52, 44);

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText(`x1=${x1.toFixed(2)} m | x2=${x2.toFixed(2)} m`, 18, h - 24);
  }

  getSceneMetrics(): CoupledSceneMetrics {
    const h = this.canvas.height;
    return {
      y: h * 0.55,
      scale: 170,
      base1: 260,
      base2: 470,
    };
  }

  getMassPixelPositions(): { m1x: number; m2x: number; y: number } {
    const { x1, x2 } = this.model.getKinematics();
    const { y, scale, base1, base2 } = this.getSceneMetrics();
    return {
      m1x: base1 + x1 * scale,
      m2x: base2 + x2 * scale,
      y,
    };
  }

  x1FromPointer(pointerX: number): number {
    const { scale, base1 } = this.getSceneMetrics();
    return (pointerX - base1) / scale;
  }

  x2FromPointer(pointerX: number): number {
    const { scale, base2 } = this.getSceneMetrics();
    return (pointerX - base2) / scale;
  }
}
