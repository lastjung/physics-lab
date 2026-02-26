import { CarSuspension } from '../simulations/carSuspension';

interface SuspensionSceneMetrics {
  cx: number;
  baseY: number;
  scale: number;
}

export class CarSuspensionCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: CarSuspension) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const k = this.model.getKinematics();
    const m = this.getMetrics();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const roadY = m.baseY + k.zr * m.scale;
    const wheelY = m.baseY + k.zu * m.scale;
    const bodyY = m.baseY - 120 + k.zs * m.scale;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const t = i / 160;
      const x = 40 + t * (w - 80);
      const y = roadY + Math.sin(i * 0.22) * 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const springTop = bodyY + 22;
    const springBottom = wheelY - 22;
    const seg = 10;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.cx, springTop);
    for (let i = 1; i <= seg; i += 1) {
      const y = springTop + ((springBottom - springTop) * i) / seg;
      const x = m.cx + (i % 2 === 0 ? -16 : 16);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(m.cx, springBottom);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(m.cx - 86, bodyY - 22, 172, 44);
    const grip = this.getGripRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(grip.x, grip.y, grip.width, grip.height);

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(m.cx, wheelY, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('Car Suspension', 18, h - 24);
  }

  getGripRect(): { x: number; y: number; width: number; height: number } {
    const m = this.getMetrics();
    const k = this.model.getKinematics();
    const p = this.model.getParams();
    const bodyY = m.baseY - 120 + k.zs * m.scale;
    return {
      x: m.cx - 28 + p.gripOffsetX,
      y: bodyY - 44 + p.gripOffsetY,
      width: 56,
      height: 14,
    };
  }

  sprungFromPointerY(py: number): number {
    const m = this.getMetrics();
    return (py - (m.baseY - 120)) / m.scale;
  }

  private getMetrics(): SuspensionSceneMetrics {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      cx: w * 0.5,
      baseY: h * 0.72,
      scale: 180,
    };
  }
}
