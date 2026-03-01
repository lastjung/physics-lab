import { WheelJointDemo } from '../simulations/wheelJointDemo';
import { BodyState } from '../engine2d/collision/types';

export class WheelJointDemoCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private model: WheelJointDemo;
  private zoom = 100;

  constructor(canvas: HTMLCanvasElement, model: WheelJointDemo) {
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
  }

  draw() {
    const { ctx } = this;
    const { width, height } = ctx.canvas;
    const scale = this.zoom;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    
    // Y-up coordinate system
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, -scale); // Invert Y
    ctx.lineWidth = 1 / scale;

    const snapshot = (this.model as any).bodies as BodyState[];
    const joints = (this.model as any).joints as any[];

    // Draw Bodies
    for (const b of snapshot) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      ctx.fillStyle = b.id === 'ground' ? '#94a3b8' : '#3b82f6';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2 / scale;

      if (b.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Line to show rotation
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(b.radius, 0);
        ctx.stroke();
      } else if (b.shape === 'aabb') {
        ctx.fillRect(-b.halfW!, -b.halfH!, b.halfW! * 2, b.halfH! * 2);
        ctx.strokeRect(-b.halfW!, -b.halfH!, b.halfW! * 2, b.halfH! * 2);
      }
      ctx.restore();
    }

    // Draw Wheel Joints (Suspension axis)
    for (const j of joints) {
      if (j.type !== 'wheel') continue;
      const bodyA = snapshot.find(b => b.id === j.bodyIdA);
      const bodyB = snapshot.find(b => b.id === j.bodyIdB);
      if (!bodyA || !bodyB) continue;

      const pA = this.getAnchorWorld(bodyA, j.localAnchorA);
      const pB = this.getAnchorWorld(bodyB, j.localAnchorB);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3 / scale;
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();

      // Draw axis
      const cosA = Math.cos(bodyA.angle);
      const sinA = Math.sin(bodyA.angle);
      const axisX = j.localAxisA.x * cosA - j.localAxisA.y * sinA;
      const axisY = j.localAxisA.x * sinA + j.localAxisA.y * cosA;
      
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.setLineDash([0.1, 0.1]);
      ctx.beginPath();
      ctx.moveTo(pA.x - axisX * 1, pA.y - axisY * 1);
      ctx.lineTo(pA.x + axisX * 1, pA.y + axisY * 1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private getAnchorWorld(body: BodyState, local: { x: number; y: number }) {
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);
    return {
      x: body.x + (local.x * cos - local.y * sin),
      y: body.y + (local.x * sin + local.y * cos)
    };
  }

  screenToWorld(sx: number, sy: number) {
    const { width, height } = this.ctx.canvas;
    return {
      x: (sx - width / 2) / this.zoom,
      y: -(sy - height / 2) / this.zoom
    };
  }
}
