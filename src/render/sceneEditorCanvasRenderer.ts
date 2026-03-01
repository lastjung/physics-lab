import { BodyState } from '../engine2d/collision/types';
import { Joint } from '../engine2d/joints/types';

export class SceneEditorCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private zoom = 120;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setZoom(z: number) {
    this.zoom = z;
  }

  render(bodies: BodyState[], joints: Joint[]) {
    const { ctx, canvas, zoom: scale } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const worldToScreen = (x: number, y: number) => ({
      x: canvas.width / 2 + x * scale,
      y: canvas.height / 2 + y * scale
    });

    // Draw Floor if exists
    for (const b of bodies) {
        if (b.id === 'floor') {
            const p = worldToScreen(b.x, b.y);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(
                p.x - b.halfW! * scale,
                p.y - b.halfH! * scale,
                b.halfW! * 2 * scale,
                b.halfH! * 2 * scale
            );
            continue;
        }

        // Draw normal bodies
        const p = worldToScreen(b.x, b.y);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(b.angle);

        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 1;

        if (b.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, b.radius * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Direction line
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(b.radius * scale, 0);
            ctx.stroke();
        } else if (b.shape === 'aabb') {
            ctx.fillRect(
                -b.halfW! * scale,
                -b.halfH! * scale,
                b.halfW! * 2 * scale,
                b.halfH! * 2 * scale
            );
            ctx.strokeRect(
                -b.halfW! * scale,
                -b.halfH! * scale,
                b.halfW! * 2 * scale,
                b.halfH! * 2 * scale
            );
        }
        ctx.restore();
    }

    // Draw Joints
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    for (const j of joints) {
        const bodyA = bodies.find(b => b.id === j.bodyIdA);
        const bodyB = bodies.find(b => b.id === j.bodyIdB);
        if (!bodyA || !bodyB) continue;

        const pA = this.getAnchorWorld(bodyA, j.localAnchorA);
        const pB = this.getAnchorWorld(bodyB, j.localAnchorB);
        
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);

        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.stroke();
    }
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
    return {
      x: (sx - this.canvas.width / 2) / this.zoom,
      y: (sy - this.canvas.height / 2) / this.zoom
    };
  }
}
