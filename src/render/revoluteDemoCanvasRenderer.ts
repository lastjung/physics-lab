import { RevoluteDemo } from '../simulations/revoluteDemo';

export class RevoluteDemoCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private model: RevoluteDemo;

  constructor(canvas: HTMLCanvasElement, model: RevoluteDemo) {
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
  }

  draw() {
    const { ctx } = this;
    const { width, height } = ctx.canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    
    // Transform to world space
    const center = { x: width / 2, y: height / 2 };
    const scale = Math.min(width, height) * 0.4;
    ctx.translate(center.x, center.y);
    ctx.scale(scale, scale);
    ctx.lineWidth = 0.02;

    // Drawing the base
    ctx.beginPath();
    ctx.arc(0, 0, 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#666';
    ctx.fill();
    ctx.stroke();

    // Drawing the arm
    const state = this.model.getState(); // [x, y, vx, vy, angle, omega]
    const x = state[0];
    const y = state[1];
    const angle = state[4];

    const params = this.model.getParams();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Draw the arm bar
    ctx.beginPath();
    ctx.moveTo(-params.armLength, 0);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 0.03;
    ctx.stroke();

    // Draw the mass at the end
    ctx.beginPath();
    ctx.arc(0, 0, 0.08, 0, 2 * Math.PI);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw the limits if enabled
    if (params.limitEnabled) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, params.armLength + 0.05, params.lowerAngle, params.upperAngle);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
  }

  screenToWorld(sx: number, sy: number) {
    const { width, height } = this.ctx.canvas;
    const center = { x: width / 2, y: height / 2 };
    const scale = Math.min(width, height) * 0.4;
    return {
      x: (sx - center.x) / scale,
      y: (sy - center.y) / scale
    };
  }
}
