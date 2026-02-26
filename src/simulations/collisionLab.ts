import type { SimulationModel, StateVector } from '../core/types';

export interface CollisionLabParams {
  mass1: number;
  mass2: number;
  radius1: number;
  radius2: number;
  restitution: number;
  wallRestitution: number;
  linearDamping: number;
  initialX1: number;
  initialY1: number;
  initialVx1: number;
  initialVy1: number;
  initialX2: number;
  initialY2: number;
  initialVx2: number;
  initialVy2: number;
}

const defaults: CollisionLabParams = {
  mass1: 1.1,
  mass2: 0.9,
  radius1: 0.14,
  radius2: 0.14,
  restitution: 0.98,
  wallRestitution: 0.97,
  linearDamping: 0.002,
  initialX1: -0.85,
  initialY1: 0.05,
  initialVx1: 1.5,
  initialVy1: -0.4,
  initialX2: 0.85,
  initialY2: -0.05,
  initialVx2: -1.2,
  initialVy2: 0.25,
};

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
};

export class CollisionLab implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: CollisionLabParams;

  constructor(params: Partial<CollisionLabParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [
      this.params.initialX1,
      this.params.initialY1,
      this.params.initialVx1,
      this.params.initialVy1,
      this.params.initialX2,
      this.params.initialY2,
      this.params.initialVx2,
      this.params.initialVy2,
    ];
  }

  static getDefaultParams(): CollisionLabParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [, , vx1, vy1, , , vx2, vy2] = state;
    const d = this.params.linearDamping;
    return [vx1, vy1, -d * vx1, -d * vy1, vx2, vy2, -d * vx2, -d * vy2];
  }

  reset(): void {
    this.state = [
      this.params.initialX1,
      this.params.initialY1,
      this.params.initialVx1,
      this.params.initialVy1,
      this.params.initialX2,
      this.params.initialY2,
      this.params.initialVx2,
      this.params.initialVy2,
    ];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CollisionLabParams>(key: K, value: CollisionLabParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CollisionLabParams {
    return { ...this.params };
  }

  setBodyState(index: 1 | 2, x: number, y: number, vx: number, vy: number): void {
    if (index === 1) {
      this.state[0] = x;
      this.state[1] = y;
      this.state[2] = vx;
      this.state[3] = vy;
    } else {
      this.state[4] = x;
      this.state[5] = y;
      this.state[6] = vx;
      this.state[7] = vy;
    }
  }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const b1 = this.getBody(1);
    const b2 = this.getBody(2);
    let maxImpact = 0;
    maxImpact = Math.max(maxImpact, this.resolveWall(b1, minX, maxX, minY, maxY));
    maxImpact = Math.max(maxImpact, this.resolveWall(b2, minX, maxX, minY, maxY));
    maxImpact = Math.max(maxImpact, this.resolveBodyCollision(b1, b2));
    this.setBodyState(1, b1.x, b1.y, b1.vx, b1.vy);
    this.setBodyState(2, b2.x, b2.y, b2.vx, b2.vy);
    return maxImpact;
  }

  getKinematics() {
    const b1 = this.getBody(1);
    const b2 = this.getBody(2);
    const speed1 = Math.hypot(b1.vx, b1.vy);
    const speed2 = Math.hypot(b2.vx, b2.vy);
    const kinetic = 0.5 * b1.mass * speed1 * speed1 + 0.5 * b2.mass * speed2 * speed2;
    return { b1, b2, kinetic };
  }

  private getBody(index: 1 | 2): Body {
    if (index === 1) {
      return {
        x: this.state[0],
        y: this.state[1],
        vx: this.state[2],
        vy: this.state[3],
        mass: this.params.mass1,
        radius: this.params.radius1,
      };
    }
    return {
      x: this.state[4],
      y: this.state[5],
      vx: this.state[6],
      vy: this.state[7],
      mass: this.params.mass2,
      radius: this.params.radius2,
    };
  }

  private resolveWall(body: Body, minX: number, maxX: number, minY: number, maxY: number): number {
    const e = this.params.wallRestitution;
    let impact = 0;
    if (body.x - body.radius < minX) {
      body.x = minX + body.radius;
      impact = Math.max(impact, Math.abs(body.vx));
      body.vx = Math.abs(body.vx) * e;
    } else if (body.x + body.radius > maxX) {
      body.x = maxX - body.radius;
      impact = Math.max(impact, Math.abs(body.vx));
      body.vx = -Math.abs(body.vx) * e;
    }

    if (body.y - body.radius < minY) {
      body.y = minY + body.radius;
      impact = Math.max(impact, Math.abs(body.vy));
      body.vy = Math.abs(body.vy) * e;
    } else if (body.y + body.radius > maxY) {
      body.y = maxY - body.radius;
      impact = Math.max(impact, Math.abs(body.vy));
      body.vy = -Math.abs(body.vy) * e;
    }
    return impact;
  }

  private resolveBodyCollision(a: Body, b: Body): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = a.radius + b.radius;
    if (distance >= minDistance) return 0;

    const nx = distance > 1e-6 ? dx / distance : 1;
    const ny = distance > 1e-6 ? dy / distance : 0;
    const overlap = minDistance - Math.max(distance, 1e-6);
    const totalMass = a.mass + b.mass;
    a.x -= nx * overlap * (b.mass / totalMass);
    a.y -= ny * overlap * (b.mass / totalMass);
    b.x += nx * overlap * (a.mass / totalMass);
    b.y += ny * overlap * (a.mass / totalMass);

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const normalSpeed = rvx * nx + rvy * ny;
    if (normalSpeed >= 0) return 0;

    const e = this.params.restitution;
    const impulse = (-(1 + e) * normalSpeed) / (1 / a.mass + 1 / b.mass);
    a.vx -= (impulse * nx) / a.mass;
    a.vy -= (impulse * ny) / a.mass;
    b.vx += (impulse * nx) / b.mass;
    b.vy += (impulse * ny) / b.mass;

    return Math.abs(normalSpeed);
  }
}
