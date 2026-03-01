import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody, createPolyline } from '../engine2d/collision/bodyFactory';
import { SimulationModel, StateVector } from '../core/types';

export interface CurvedObjectDemoParams {
  gravity: number;
  restitution: number;
  friction: number;
  subSteps: number;
}

export class CurvedObjectDemo implements SimulationModel {
  private bodies: BodyState[] = [];
  private time = 0;
  private params: CurvedObjectDemoParams;

  getJoints() { return []; }

  constructor(params: CurvedObjectDemoParams) {
    this.params = { ...params };
    this.reset();
  }

    static getDefaultParams(): CurvedObjectDemoParams {
        return {
            gravity: 9.8,
            restitution: 0.5,
            friction: 0.1,
            subSteps: 4
        };
    }

    reset(): void {
    this.bodies = [];
    this.time = 0;

    const curvePoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= 40; i++) {
        const tx = -10 + i * 0.5;
        const ty = Math.sin(tx * 0.8) * 1.5 - 2.0;
        curvePoints.push({ x: tx, y: ty });
    }
    
    const ground = createPolyline('curve-ground', curvePoints, { isStatic: true });
    this.bodies.push(ground);

    // Deterministic starts: place balls HIGH above the rail so user sees the drop.
    const starts = [
      { x: -8.0, r: 0.32 },
      { x: -4.5, r: 0.36 },
      { x: -1.0, r: 0.34 },
      { x: 2.8,  r: 0.38 },
      { x: 6.1,  r: 0.35 },
    ];

    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const ball = createBody(`ball-${i}`, 0, 0, { radius: s.r });
      ball.x = s.x;
      ball.y = 3 + i * 0.8;  // Above the curve but inside viewport
      ball.vx = 0;
      ball.vy = 0;
      this.bodies.push(ball);
    }
  }

  private curveY(x: number): number {
    return Math.sin(x * 0.8) * 1.5 - 2.0;
  }

  getState(): StateVector {
    const state: number[] = [];
    for (const b of this.bodies) {
        state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
    }
    return state;
  }

  setState(next: StateVector): void {
    let cursor = 0;
    for (const b of this.bodies) {
        b.x = next[cursor++];
        b.y = next[cursor++];
        b.vx = next[cursor++];
        b.vy = next[cursor++];
        b.angle = next[cursor++];
        b.omega = next[cursor++];
    }
  }

  derivatives(): StateVector {
    return new Array(this.bodies.length * 6).fill(0);
  }

  getTime(): number { return this.time; }
  setTime(t: number): void { this.time = t; }

  getParams(): CurvedObjectDemoParams { return { ...this.params }; }
  setParams(p: Partial<CurvedObjectDemoParams>): void {
    this.params = { ...this.params, ...p };
  }

  getBodies(): BodyState[] { return this.bodies; }

  step(dt: number): void {
    const subStepDt = dt / this.params.subSteps;
    for (let s = 0; s < this.params.subSteps; s++) {
        // 1. Integrate
        for (const b of this.bodies) {
            if (b.invMass > 0) {
                b.vy -= this.params.gravity * subStepDt;
                b.x += b.vx * subStepDt;
                b.y += b.vy * subStepDt;
                b.angle += b.omega * subStepDt;
            }
        }

        // 2. Update world vertices for all polygons (if any)
        for (const b of this.bodies) {
            if (b.shape === 'polygon' && b.localVertices) {
                const cos = Math.cos(b.angle);
                const sin = Math.sin(b.angle);
                b.worldVertices = b.localVertices.map(v => ({
                    x: b.x + (v.x * cos - v.y * sin),
                    y: b.y + (v.x * sin + v.y * cos)
                }));
            }
        }

        // 3. Resolve
        stepCollisionPipeline(this.bodies, {
            velocityIterations: 8,
            positionIterations: 3,
            dt: subStepDt
        });
    }
    this.time += dt;
  }
}
