import { RollerCoasterFlight } from '../simulations/rollerCoasterFlight';

export interface CoasterFlightBounds {
  minX: number;
  maxX: number;
}

export class RollerCoasterFlightCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: RollerCoasterFlight) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  getBounds(): CoasterFlightBounds {
    return { minX: -2.4, maxX: 2.4 };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const b = this.getBounds();
    const minY = -1.6;
    const maxY = 1.8;
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
    ctx.fillStyle = '#ecfeff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const samples = 220;
    for (let i = 0; i <= samples; i += 1) {
      const x = b.minX + ((b.maxX - b.minX) * i) / samples;
      const y = this.model.trackY(x);
      const p = this.worldToScreen(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const k = this.model.getKinematics();
    const car = this.worldToScreen(k.x, k.y);
    ctx.fillStyle = k.airborne ? '#f97316' : '#dc2626';
    ctx.beginPath();
    ctx.arc(car.x, car.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText(k.airborne ? 'Flight phase active' : 'Track contact mode', 18, h - 22);
  }
}
