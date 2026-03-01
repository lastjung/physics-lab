import type { SimulationModel, StateVector } from '../core/types';
import type { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface PolygonShapesParams {
  gravity: number;
  damping: number;
  angularDamping: number;
  restitution: number;
  wallRestitution: number;
  friction: number;
}

const defaults: PolygonShapesParams = {
  gravity: 9.81,
  damping: 0.02,
  angularDamping: 0.06,
  restitution: 0.58,
  wallRestitution: 0.42,
  friction: 0.32,
};

const tri = (s: number) => [
  { x: 0, y: s },
  { x: -s * 0.86, y: -s * 0.5 },
  { x: s * 0.86, y: -s * 0.5 },
];

const box = (w: number, h: number) => [
  { x: -w, y: -h },
  { x: w, y: -h },
  { x: w, y: h },
  { x: -w, y: h },
];

const pent = (r: number) => {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return out;
};

export class PolygonShapes implements SimulationModel {
  private bodies: BodyState[] = [];
  private time = 0;
  private params: PolygonShapesParams;

  constructor(params: Partial<PolygonShapesParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): PolygonShapesParams {
    return { ...defaults };
  }

  private buildBody(
    id: string,
    x: number,
    y: number,
    verts: { x: number; y: number }[],
    mass = 1,
  ): BodyState {
    const inertia = Math.max(0.2, mass * 0.12);
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      mass,
      invMass: 1 / mass,
      restitution: this.params.restitution,
      radius: 0,
      friction: this.params.friction,
      shape: 'polygon',
      localVertices: verts,
      worldVertices: [],
      angle: 0,
      omega: 0,
      inertia,
      invInertia: 1 / inertia,
    };
  }

  getState(): StateVector {
    const state: number[] = [];
    for (const b of this.bodies) state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
    return state;
  }

  setState(next: StateVector): void {
    let c = 0;
    for (const b of this.bodies) {
      b.x = next[c++];
      b.y = next[c++];
      b.vx = next[c++];
      b.vy = next[c++];
      b.angle = next[c++];
      b.omega = next[c++];
    }
  }

  derivatives(state: StateVector): StateVector {
    const out: number[] = [];
    for (let i = 0; i < state.length; i += 6) {
      const vx = state[i + 2];
      const vy = state[i + 3];
      const omega = state[i + 5];
      out.push(
        vx,
        vy,
        -this.params.damping * vx,
        -this.params.gravity - this.params.damping * vy,
        omega,
        -this.params.angularDamping * omega,
      );
    }
    return out;
  }

  reset(): void {
    this.time = 0;
    this.bodies = [
      this.buildBody('poly_tri', -0.9, 0.85, tri(0.18), 0.9),
      this.buildBody('poly_box', 0.1, 0.95, box(0.16, 0.12), 1.1),
      this.buildBody('poly_pent', 0.95, 0.9, pent(0.15), 1.0),
      this.buildBody('poly_box2', -0.2, 0.45, box(0.22, 0.08), 1.2),
      this.buildBody('poly_tri2', 0.7, 0.48, tri(0.15), 0.95),
    ];
    this.bodies[0].vx = 0.9;
    this.bodies[2].vx = -0.7;
    this.bodies[1].omega = 0.9;
    this.bodies[3].omega = -0.75;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof PolygonShapesParams>(key: K, value: PolygonShapesParams[K]): void {
    this.params = { ...this.params, [key]: value };
    if (key === 'restitution' || key === 'friction') {
      this.bodies.forEach((b) => {
        b.restitution = this.params.restitution;
        b.friction = this.params.friction;
      });
    }
  }

  getParams(): PolygonShapesParams {
    return { ...this.params };
  }

  getBodies(): BodyState[] {
    return this.bodies;
  }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const e = this.params.wallRestitution;
    let wallImpact = 0;

    for (const b of this.bodies) {
      const verts = b.localVertices ?? [];
      let maxR = 0;
      for (const v of verts) maxR = Math.max(maxR, Math.hypot(v.x, v.y));

      if (b.x - maxR < minX) {
        b.x = minX + maxR;
        wallImpact = Math.max(wallImpact, Math.abs(b.vx));
        b.vx = Math.abs(b.vx) * e;
      } else if (b.x + maxR > maxX) {
        b.x = maxX - maxR;
        wallImpact = Math.max(wallImpact, Math.abs(b.vx));
        b.vx = -Math.abs(b.vx) * e;
      }

      if (b.y - maxR < minY) {
        b.y = minY + maxR;
        wallImpact = Math.max(wallImpact, Math.abs(b.vy));
        b.vy = Math.abs(b.vy) * e;
      } else if (b.y + maxR > maxY) {
        b.y = maxY - maxR;
        wallImpact = Math.max(wallImpact, Math.abs(b.vy));
        b.vy = -Math.abs(b.vy) * e;
      }
    }

    const res = stepCollisionPipeline(this.bodies, {
      dt: 1 / 120,
      velocityIterations: 10,
      positionIterations: 8,
      warmStart: true,
      ccd: false,
    });

    return Math.max(wallImpact, res.impulse);
  }

  getKinematics() {
    let kinetic = 0;
    let maxSpeed = 0;
    for (const b of this.bodies) {
      const s = Math.hypot(b.vx, b.vy);
      maxSpeed = Math.max(maxSpeed, s);
      kinetic += 0.5 * b.mass * s * s + 0.5 * b.inertia * b.omega * b.omega;
    }
    return {
      count: this.bodies.length,
      kinetic,
      maxSpeed,
    };
  }
}
