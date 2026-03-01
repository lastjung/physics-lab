import { BodyState } from '../engine2d/collision/types';
import { Joint } from '../engine2d/joints/types';

export interface JointCreationPreview {
  from: { x: number; y: number };
  to: { x: number; y: number };
  mode: 'revolute' | 'prismatic' | 'weld';
}

export interface SelectionBoxPreview {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

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

  render(
    bodies: BodyState[],
    joints: Joint[],
    selectedIds: string[] = [],
    preview: JointCreationPreview | null = null,
    selectionBox: SelectionBoxPreview | null = null
  ) {
    const { ctx, canvas, zoom: scale } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const selected = new Set(selectedIds);

    const worldToScreen = (x: number, y: number) => ({
      x: canvas.width / 2 + x * scale,
      y: canvas.height / 2 + y * scale
    });

    // Draw Floor if exists
    for (const b of bodies) {
        const isSelected = selected.has(b.id);
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

        ctx.fillStyle = isSelected ? '#fb923c' : '#3b82f6';
        ctx.strokeStyle = isSelected ? '#ea580c' : '#1e3a8a';
        ctx.lineWidth = isSelected ? 3 : 1;

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
    for (const j of joints) {
        const isSelected = selected.has(j.id);
        const bodyA = bodies.find(b => b.id === j.bodyIdA);
        const bodyB = bodies.find(b => b.id === j.bodyIdB);
        if (!bodyA || !bodyB) continue;

        const pA = this.getAnchorWorld(bodyA, j.localAnchorA);
        const pB = this.getAnchorWorld(bodyB, j.localAnchorB);
        
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);

        ctx.strokeStyle = isSelected ? '#fb923c' : (j.type === 'weld' ? '#10b981' : '#ef4444');
        ctx.lineWidth = isSelected ? 4 : 2;

        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.stroke();

        // Draw anchor marks
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(sA.x, sA.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sB.x, sB.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    if (preview) {
      const sA = worldToScreen(preview.from.x, preview.from.y);
      const sB = worldToScreen(preview.to.x, preview.to.y);
      const color =
        preview.mode === 'weld' ? '#10b981' :
        preview.mode === 'prismatic' ? '#0ea5e9' :
        '#f97316';

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(sA.x, sA.y);
      ctx.lineTo(sB.x, sB.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sA.x, sA.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sB.x, sB.y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (preview.mode === 'prismatic') {
        const dx = sB.x - sA.x;
        const dy = sB.y - sA.y;
        const len = Math.hypot(dx, dy);
        if (len > 1e-6) {
          const ux = dx / len;
          const uy = dy / len;
          const arrowLen = 14;
          const px = -uy;
          const py = ux;
          const hx = sB.x - ux * arrowLen;
          const hy = sB.y - uy * arrowLen;
          ctx.beginPath();
          ctx.moveTo(sB.x, sB.y);
          ctx.lineTo(hx + px * 5, hy + py * 5);
          ctx.lineTo(hx - px * 5, hy - py * 5);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (selectionBox) {
      const a = worldToScreen(selectionBox.from.x, selectionBox.from.y);
      const b = worldToScreen(selectionBox.to.x, selectionBox.to.y);
      const left = Math.min(a.x, b.x);
      const top = Math.min(a.y, b.y);
      const width = Math.abs(a.x - b.x);
      const height = Math.abs(a.y - b.y);
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.fillRect(left, top, width, height);
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
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
