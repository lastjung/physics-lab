import { BodyState } from '../engine2d/collision/types';
import { Joint } from '../engine2d/joints/types';

export interface Engine2DModelLike {
    getBodies(): BodyState[];
    getJoints?(): Joint[];
}

export class Engine2DCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 30; // pixels per meter
  private originX: number;
  private originY: number;

  constructor(private canvas: HTMLCanvasElement, private model: Engine2DModelLike) {
    this.ctx = canvas.getContext('2d')!;
    this.originX = canvas.width / 2;
    this.originY = canvas.height / 2;
  }

  setOrigin(x: number, y: number) { this.originX = x; this.originY = y; }
  setScale(s: number) { this.scale = s; }

  worldToScreen(x: number, y: number) {
    return {
      x: this.originX + x * this.scale,
      y: this.originY - y * this.scale
    };
  }

  screenToWorld(sx: number, sy: number) {
    return {
      x: (sx - this.originX) / this.scale,
      y: (this.originY - sy) / this.scale
    };
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const bodies = this.model.getBodies();
    const joints = this.model.getJoints ? this.model.getJoints() : [];

    // Draw Joints
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = '#aaaaaa';
    this.ctx.lineWidth = 1;
    for (const j of joints) {
        const bA = bodies.find(b => b.id === j.bodyIdA);
        const bB = bodies.find(b => b.id === j.bodyIdB);
        if (!bA || !bB) continue;

        const cosA = Math.cos(bA.angle), sinA = Math.sin(bA.angle);
        const cosB = Math.cos(bB.angle), sinB = Math.sin(bB.angle);
        const wa = {
            x: bA.x + (j.localAnchorA.x * cosA - j.localAnchorA.y * sinA),
            y: bA.y + (j.localAnchorA.x * sinA + j.localAnchorA.y * cosA)
        };
        const wb = {
            x: bB.x + (j.localAnchorB.x * cosB - j.localAnchorB.y * sinB),
            y: bB.y + (j.localAnchorB.x * sinB + j.localAnchorB.y * cosB)
        };
        const p1 = this.worldToScreen(wa.x, wa.y);
        const p2 = this.worldToScreen(wb.x, wb.y);

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }
    this.ctx.setLineDash([]);

    // Draw Bodies
    for (let idx = 0; idx < bodies.length; idx++) {
      const b = bodies[idx];
      if (b.shape === 'polyline') {
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < b.localVertices!.length; i++) {
            const v = b.localVertices![i];
            const p = this.worldToScreen(v.x, v.y);
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        continue;
      }

      const p = this.worldToScreen(b.x, b.y);
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(-b.angle);

      this.ctx.fillStyle = b.invMass === 0 ? '#4b5563' : this.bodyColor(idx);
      this.ctx.strokeStyle = b.invMass === 0 ? '#374151' : this.bodyStroke(idx);
      this.ctx.lineWidth = 2;

      if (b.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, b.radius! * this.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        // Line for rotation
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(b.radius! * this.scale, 0);
        this.ctx.stroke();
      } else if (b.shape === 'aabb' || b.shape === 'polygon') {
        this.ctx.beginPath();
        const verts = b.localVertices!;
        for (let i = 0; i < verts.length; i++) {
          const v = verts[i];
          if (i === 0) this.ctx.moveTo(v.x * this.scale, -v.y * this.scale);
          else this.ctx.lineTo(v.x * this.scale, -v.y * this.scale);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  private bodyColor(idx: number): string {
    const hues = [0, 30, 55, 120, 200, 270, 320];
    const hue = hues[idx % hues.length];
    return `hsl(${hue}, 75%, 55%)`;
  }

  private bodyStroke(idx: number): string {
    const hues = [0, 30, 55, 120, 200, 270, 320];
    const hue = hues[idx % hues.length];
    return `hsl(${hue}, 80%, 35%)`;
  }
}
