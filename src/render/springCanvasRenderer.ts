import { SpringMass } from '../simulations/springMass';

export class SpringCanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly model: SpringMass) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const centerY = h * 0.52;
    const wallX = 80;
    const baseX = 330;
    const pixelsPerMeter = 220;

    const { x } = this.model.getKinematics();
    const blockCenterX = baseX + x * pixelsPerMeter;
    const blockW = 82;
    const blockH = 62;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#475569';
    ctx.fillRect(wallX - 22, 90, 22, h - 170);

    const springStart = wallX;
    const springEnd = blockCenterX - blockW / 2;
    const coils = 14;
    const amp = 15;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(springStart, centerY);
    for (let i = 1; i <= coils; i += 1) {
      const t = i / coils;
      const px = springStart + (springEnd - springStart) * t;
      const py = centerY + (i % 2 === 0 ? -amp : amp);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(springEnd, centerY);
    ctx.stroke();

    const left = blockCenterX - blockW / 2;
    const top = centerY - blockH / 2;
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(left, top, blockW, blockH);

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Avenir Next", sans-serif';
    ctx.fillText('x=0', baseX - 14, centerY + 56);
    ctx.fillText(`x=${x.toFixed(3)} m`, 18, h - 24);
  }

  getBlockPixelPosition(): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerY = h * 0.52;
    const baseX = 330;
    const pixelsPerMeter = 220;
    const blockW = 82;
    const { x } = this.model.getKinematics();
    const blockCenterX = baseX + x * pixelsPerMeter;
    return { x: blockCenterX - blockW / 2, y: centerY };
  }

  xFromPointer(px: number): number {
    const baseX = 330;
    const pixelsPerMeter = 220;
    const blockW = 82;
    return (px + blockW / 2 - baseX) / pixelsPerMeter;
  }
}
