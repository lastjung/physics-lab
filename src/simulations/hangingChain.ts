import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { Joint } from '../engine2d/joints/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface HangingChainParams {
  segments: number;
  linkLength: number;
  gravity: number;
  damping: number;
  nodeRadius: number;
  iterations: number;
  stiffness: number; // For future soft joints, currently use beta
}

const defaults: HangingChainParams = {
  segments: 12,
  linkLength: 0.15,
  gravity: 9.8,
  damping: 0.05,
  nodeRadius: 0.04,
  iterations: 10,
  stiffness: 0.2
};

export class HangingChain implements SimulationModel {
  private state: StateVector = [];
  private time = 0;
  private params: HangingChainParams;
  private joints: Joint[] = [];

  constructor(params: Partial<HangingChainParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): HangingChainParams {
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
    const N = this.params.segments;
    const g = this.params.gravity;
    const d = this.params.damping;

    for (let i = 0; i < N; i++) {
        const k = i * 4;
        const vx = state[k + 2];
        const vy = state[k + 3];

        out[k] = vx;
        out[k + 1] = vy;
        
        // Skip forces for anchor (index 0) if it is fixed
        if (i === 0) {
            out[k + 2] = 0;
            out[k + 3] = 0;
        } else {
            out[k + 2] = -d * vx; // Damping
            out[k + 3] = g - d * vy; // Gravity + Damping
        }
    }
    return out;
  }

  reset(): void {
    const N = this.params.segments;
    const L = this.params.linkLength;
    const r = this.params.nodeRadius;
    const state: number[] = [];

    // Anchor at (0, -0.8)
    for (let i = 0; i < N; i++) {
        state.push(i * L, -0.8, 0, 0);
    }
    this.state = state;
    this.time = 0;
    this.updateJoints();
  }

  private updateJoints() {
    this.joints = [];
    const N = this.params.segments;
    const L = this.params.linkLength;
    for (let i = 0; i < N - 1; i++) {
        this.joints.push({
            id: `j${i}`,
            type: 'distance',
            bodyIdA: `n${i}`,
            bodyIdB: `n${i+1}`,
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            length: L
        });
    }
  }

  getTime(): number { return this.time; }
  setTime(time: number): void { this.time = time; }

  setParam<K extends keyof HangingChainParams>(key: K, value: HangingChainParams[K]): void {
    this.params = { ...this.params, [key]: value };
    if (key === 'segments' || key === 'linkLength') {
        this.reset();
    }
  }

  getParams(): HangingChainParams { return { ...this.params }; }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const bodies = this.getBodies();
    // Add a floor at maxY
    const floor: BodyState = {
        id: 'floor',
        x: (minX + maxX) / 2,
        y: maxY + 0.5,
        vx: 0, vy: 0,
        mass: 0, invMass: 0,
        restitution: 0.1,
        radius: 0,
        friction: 0.5,
        shape: 'aabb',
        halfW: (maxX - minX) / 2,
        halfH: 0.5,
        angle: 0, omega: 0, inertia: 0, invInertia: 0
    };

    const res = stepCollisionPipeline([...bodies, floor], {
        velocityIterations: this.params.iterations,
        positionIterations: this.params.iterations,
        joints: this.joints,
        beta: this.params.stiffness,
        dt: 1/120 // Internal sub-stepping or just small dt
    });

    // Update state from bodies
    for (let i = 0; i < this.params.segments; i++) {
        const b = bodies[i];
        const k = i * 4;
        this.state[k] = b.x;
        this.state[k + 1] = b.y;
        this.state[k + 2] = b.vx;
        this.state[k + 3] = b.vy;
    }

    return res.impulse;
  }

  private getBodies(): BodyState[] {
    const bodies: BodyState[] = [];
    for (let i = 0; i < this.params.segments; i++) {
        const k = i * 4;
        bodies.push({
            id: `n${i}`,
            x: this.state[k],
            y: this.state[k+1],
            vx: this.state[k+2],
            vy: this.state[k+3],
            mass: 1,
            invMass: i === 0 ? 0 : 1, // Anchor is fixed
            restitution: 0.5,
            friction: 0.3,
            radius: this.params.nodeRadius,
            shape: 'circle',
            angle: 0, omega: 0, inertia: 1, invInertia: 1
        });
    }
    return bodies;
  }

  getStats() {
    let totalError = 0;
    const N = this.params.segments;
    const L = this.params.linkLength;
    for (let i = 0; i < N - 1; i++) {
        const k1 = i * 4;
        const k2 = (i + 1) * 4;
        const dist = Math.hypot(this.state[k2] - this.state[k1], this.state[k2 + 1] - this.state[k1 + 1]);
        totalError += Math.abs(dist - L);
    }
    return {
        avgError: N > 1 ? totalError / (N - 1) : 0,
        maxTension: 0 // Tension calculation would require joint impulses, complicated to extract now
    };
  }
}
