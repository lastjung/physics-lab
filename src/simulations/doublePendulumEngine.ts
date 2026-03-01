import type { SimulationModel, StateVector } from '../core/types';
import type { BodyState } from '../engine2d/collision/types';
import type { Joint } from '../engine2d/joints/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface DoublePendulumEngineParams {
  length1: number;
  length2: number;
  mass1: number;
  mass2: number;
  gravity: number;
  damping: number;
  restitution: number;
  iterations: number;
  initialTheta1: number;
  initialTheta2: number;
  initialOmega1: number;
  initialOmega2: number;
}

const defaults: DoublePendulumEngineParams = {
  length1: 1.05,
  length2: 0.95,
  mass1: 1,
  mass2: 1,
  gravity: 9.81,
  damping: 0.04,
  restitution: 0.35,
  iterations: 12,
  initialTheta1: 1.1,
  initialTheta2: 0.8,
  initialOmega1: 0,
  initialOmega2: 0,
};

const ANCHOR = { x: 0, y: -0.9 };

export class DoublePendulumEngine implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: DoublePendulumEngineParams;

  constructor(params: Partial<DoublePendulumEngineParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = this.buildInitialState();
  }

  static getDefaultParams(): DoublePendulumEngineParams {
    return { ...defaults };
  }

  private buildInitialState(): StateVector {
    const p = this.params;
    const x1 = ANCHOR.x + p.length1 * Math.sin(p.initialTheta1);
    const y1 = ANCHOR.y + p.length1 * Math.cos(p.initialTheta1);
    const x2 = x1 + p.length2 * Math.sin(p.initialTheta2);
    const y2 = y1 + p.length2 * Math.cos(p.initialTheta2);

    const vx1 = p.length1 * p.initialOmega1 * Math.cos(p.initialTheta1);
    const vy1 = -p.length1 * p.initialOmega1 * Math.sin(p.initialTheta1);
    const vx2 = vx1 + p.length2 * p.initialOmega2 * Math.cos(p.initialTheta2);
    const vy2 = vy1 - p.length2 * p.initialOmega2 * Math.sin(p.initialTheta2);

    return [x1, y1, vx1, vy1, 0, p.initialOmega1, x2, y2, vx2, vy2, 0, p.initialOmega2];
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const out: number[] = [];
    const g = this.params.gravity;
    const d = this.params.damping;
    for (let i = 0; i < state.length; i += 6) {
      const vx = state[i + 2];
      const vy = state[i + 3];
      const omega = state[i + 5];
      out.push(vx, vy, -d * vx, g - d * vy, omega, -d * omega * 0.5);
    }
    return out;
  }

  reset(): void {
    this.state = this.buildInitialState();
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof DoublePendulumEngineParams>(key: K, value: DoublePendulumEngineParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): DoublePendulumEngineParams {
    return { ...this.params };
  }

  getAnchor() {
    return { ...ANCHOR };
  }

  setBobPosition(index: 1 | 2, x: number, y: number): void {
    const o = index === 1 ? 0 : 6;
    this.state[o] = x;
    this.state[o + 1] = y;
    this.state[o + 2] = 0;
    this.state[o + 3] = 0;
    this.state[o + 5] = 0;
  }

  private buildBodies(): BodyState[] {
    const p = this.params;
    const m1 = Math.max(0.05, p.mass1);
    const m2 = Math.max(0.05, p.mass2);
    const r1 = Math.max(0.04, 0.055 * Math.sqrt(m1));
    const r2 = Math.max(0.04, 0.055 * Math.sqrt(m2));

    const b1: BodyState = {
      id: 'dp_b1',
      x: this.state[0],
      y: this.state[1],
      vx: this.state[2],
      vy: this.state[3],
      mass: m1,
      invMass: 1 / m1,
      restitution: p.restitution,
      radius: r1,
      friction: 0.25,
      shape: 'circle',
      angle: this.state[4],
      omega: this.state[5],
      inertia: Math.max(0.01, 0.5 * m1 * r1 * r1),
      invInertia: 1 / Math.max(0.01, 0.5 * m1 * r1 * r1),
    };

    const b2: BodyState = {
      id: 'dp_b2',
      x: this.state[6],
      y: this.state[7],
      vx: this.state[8],
      vy: this.state[9],
      mass: m2,
      invMass: 1 / m2,
      restitution: p.restitution,
      radius: r2,
      friction: 0.25,
      shape: 'circle',
      angle: this.state[10],
      omega: this.state[11],
      inertia: Math.max(0.01, 0.5 * m2 * r2 * r2),
      invInertia: 1 / Math.max(0.01, 0.5 * m2 * r2 * r2),
    };

    return [b1, b2];
  }

  private buildJoints(): Joint[] {
    return [
      {
        id: 'dp_j1',
        type: 'distance',
        bodyIdA: 'dp_anchor',
        bodyIdB: 'dp_b1',
        localAnchorA: { x: 0, y: 0 },
        localAnchorB: { x: 0, y: 0 },
        length: this.params.length1,
      },
      {
        id: 'dp_j2',
        type: 'distance',
        bodyIdA: 'dp_b1',
        bodyIdB: 'dp_b2',
        localAnchorA: { x: 0, y: 0 },
        localAnchorB: { x: 0, y: 0 },
        length: this.params.length2,
      },
    ];
  }

  resolveConstraints(): number {
    const bodies = this.buildBodies();
    const anchor: BodyState = {
      id: 'dp_anchor',
      x: ANCHOR.x,
      y: ANCHOR.y,
      vx: 0,
      vy: 0,
      mass: 0,
      invMass: 0,
      restitution: 0,
      radius: 0.02,
      friction: 0,
      shape: 'circle',
      angle: 0,
      omega: 0,
      inertia: 0,
      invInertia: 0,
    };

    const res = stepCollisionPipeline([anchor, ...bodies], {
      joints: this.buildJoints(),
      velocityIterations: this.params.iterations,
      positionIterations: this.params.iterations,
      beta: 0.22,
      dt: 1 / 120,
    });

    this.state[0] = bodies[0].x;
    this.state[1] = bodies[0].y;
    this.state[2] = bodies[0].vx;
    this.state[3] = bodies[0].vy;
    this.state[4] = bodies[0].angle;
    this.state[5] = bodies[0].omega;

    this.state[6] = bodies[1].x;
    this.state[7] = bodies[1].y;
    this.state[8] = bodies[1].vx;
    this.state[9] = bodies[1].vy;
    this.state[10] = bodies[1].angle;
    this.state[11] = bodies[1].omega;

    return res.impulse;
  }

  getKinematics() {
    const x1 = this.state[0];
    const y1 = this.state[1];
    const x2 = this.state[6];
    const y2 = this.state[7];
    const vx1 = this.state[2];
    const vy1 = this.state[3];
    const vx2 = this.state[8];
    const vy2 = this.state[9];

    const th1 = Math.atan2(x1 - ANCHOR.x, y1 - ANCHOR.y);
    const th2 = Math.atan2(x2 - x1, y2 - y1);

    const speed1 = Math.hypot(vx1, vy1);
    const speed2 = Math.hypot(vx2, vy2);

    const kinetic = 0.5 * this.params.mass1 * speed1 * speed1 + 0.5 * this.params.mass2 * speed2 * speed2;
    const potential = this.params.mass1 * this.params.gravity * (y1 - ANCHOR.y) + this.params.mass2 * this.params.gravity * (y2 - ANCHOR.y);

    const lenErr1 = Math.abs(Math.hypot(x1 - ANCHOR.x, y1 - ANCHOR.y) - this.params.length1);
    const lenErr2 = Math.abs(Math.hypot(x2 - x1, y2 - y1) - this.params.length2);

    return {
      x1,
      y1,
      x2,
      y2,
      vx1,
      vy1,
      vx2,
      vy2,
      theta1: th1,
      theta2: th2,
      omega1: this.state[5],
      omega2: this.state[11],
      lenErr1,
      lenErr2,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }
}
