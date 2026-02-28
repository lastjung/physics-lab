import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface PileAttractParams {
  particleCount: number;
  attractStrength: number;
  damping: number;
  restitution: number;
  nodeRadius: number;
  boundaryMode: 'bounce' | 'wrap';
  attractorX: number;
  attractorY: number;
}

const defaults: PileAttractParams = {
  particleCount: 60,
  attractStrength: 1.5,
  damping: 0.1,
  restitution: 0.5,
  nodeRadius: 0.05,
  boundaryMode: 'bounce',
  attractorX: 0,
  attractorY: 0
};

export class PileAttract implements SimulationModel {
  private state: StateVector = [];
  private time = 0;
  private params: PileAttractParams;

  constructor(params: Partial<PileAttractParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): PileAttractParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const out = new Array(state.length).fill(0);
    const N = this.params.particleCount;
    const k = this.params.attractStrength;
    const ax = this.params.attractorX;
    const ay = this.params.attractorY;
    const d = this.params.damping;
    const eps = 0.01;

    for (let i = 0; i < N; i++) {
      const idx = i * 4;
      const x = state[idx];
      const y = state[idx + 1];
      const vx = state[idx + 2];
      const vy = state[idx + 3];

      out[idx] = vx;
      out[idx + 1] = vy;

      const dx = ax - x;
      const dy = ay - y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) + 1e-6;
      
      // Inverse square law: F = k / r^2
      // Direction: (ax-x)/dist
      const forceMag = k / (distSq + eps);
      const fx = (dx / dist) * forceMag;
      const fy = (dy / dist) * forceMag;

      out[idx + 2] = fx - d * vx;
      out[idx + 3] = fy - d * vy;
    }
    return out;
  }

  reset(): void {
    const N = this.params.particleCount;
    const state: number[] = [];
    for (let i = 0; i < N; i++) {
      // Random position in range [-1.5, 1.5]
      state.push(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        0, 0
      );
    }
    this.state = state;
    this.time = 0;
  }

  getTime(): number { return this.time; }
  setTime(time: number): void { this.time = time; }

  setParam<K extends keyof PileAttractParams>(key: K, value: PileAttractParams[K]): void {
    this.params = { ...this.params, [key]: value };
    if (key === 'particleCount') {
      this.reset();
    }
  }

  getParams(): PileAttractParams { return { ...this.params }; }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const N = this.params.particleCount;
    const bodies = this.getBodies();
    
    // Resolve inter-particle collisions
    const res = stepCollisionPipeline(bodies, {
      velocityIterations: 4,
      positionIterations: 3,
      dt: 1/60
    });

    // Boundary handling & State update
    const nextState: number[] = [];
    for (let i = 0; i < N; i++) {
      const b = bodies[i];
      let { x, y, vx, vy } = b;

      if (this.params.boundaryMode === 'bounce') {
        const r = b.radius;
        if (x - r < minX) { x = minX + r; vx = Math.abs(vx) * this.params.restitution; }
        if (x + r > maxX) { x = maxX - r; vx = -Math.abs(vx) * this.params.restitution; }
        if (y - r < minY) { y = minY + r; vy = Math.abs(vy) * this.params.restitution; }
        if (y + r > maxY) { y = maxY - r; vy = -Math.abs(vy) * this.params.restitution; }
      } else {
        // Wrap
        if (x < minX) x = maxX;
        else if (x > maxX) x = minX;
        if (y < minY) y = maxY;
        else if (y > maxY) y = minY;
      }

      nextState.push(x, y, vx, vy);
    }
    this.state = nextState;
    return res.impulse;
  }

  private getBodies(): BodyState[] {
    const bodies: BodyState[] = [];
    for (let i = 0; i < this.params.particleCount; i++) {
      const idx = i * 4;
      bodies.push({
        id: `p${i}`,
        x: this.state[idx],
        y: this.state[idx + 1],
        vx: this.state[idx + 2],
        vy: this.state[idx + 3],
        mass: 1,
        invMass: 1,
        restitution: this.params.restitution,
        friction: 0.1,
        radius: this.params.nodeRadius,
        shape: 'circle',
        angle: 0, omega: 0, inertia: 1, invInertia: 1
      });
    }
    return bodies;
  }

  getStats() {
    let totalR = 0;
    const N = this.params.particleCount;
    const ax = this.params.attractorX;
    const ay = this.params.attractorY;
    for (let i = 0; i < N; i++) {
      const idx = i * 4;
      totalR += Math.hypot(this.state[idx] - ax, this.state[idx + 1] - ay);
    }
    return {
      avgRadius: N > 0 ? totalR / N : 0,
      particleCount: N
    };
  }
}
