import type { SimulationModel, StateVector } from '../core/types';

export interface BilliardsParams {
  mass: number;
  radius: number;
  restitution: number;
  wallRestitution: number;
  linearDamping: number;
  cueSpeed: number;
}

type Ball = { x: number; y: number; vx: number; vy: number; r: number; m: number };

const BALL_COUNT = 6;

const defaults: BilliardsParams = {
  mass: 1,
  radius: 0.1,
  restitution: 0.96,
  wallRestitution: 0.93,
  linearDamping: 0.01,
  cueSpeed: 3.2,
};

export class Billiards implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: BilliardsParams;

  constructor(params: Partial<BilliardsParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = this.makeRackState();
  }

  static getDefaultParams(): BilliardsParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const d = this.params.linearDamping;
    const out: number[] = new Array(BALL_COUNT * 4).fill(0);
    for (let i = 0; i < BALL_COUNT; i += 1) {
      const k = i * 4;
      const vx = state[k + 2];
      const vy = state[k + 3];
      out[k] = vx;
      out[k + 1] = vy;
      out[k + 2] = -d * vx;
      out[k + 3] = -d * vy;
    }
    return out;
  }

  reset(): void {
    this.state = this.makeRackState();
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof BilliardsParams>(key: K, value: BilliardsParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): BilliardsParams {
    return { ...this.params };
  }

  setBallState(index: number, x: number, y: number, vx: number, vy: number): void {
    if (index < 0 || index >= BALL_COUNT) return;
    const k = index * 4;
    this.state[k] = x;
    this.state[k + 1] = y;
    this.state[k + 2] = vx;
    this.state[k + 3] = vy;
  }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const balls = this.getBalls();
    let maxImpact = 0;

    for (let i = 0; i < balls.length; i += 1) {
      maxImpact = Math.max(maxImpact, this.resolveWall(balls[i], minX, maxX, minY, maxY));
    }

    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        maxImpact = Math.max(maxImpact, this.resolvePair(balls[i], balls[j]));
      }
    }

    balls.forEach((b, i) => this.setBallState(i, b.x, b.y, b.vx, b.vy));
    return maxImpact;
  }

  getKinematics() {
    const balls = this.getBalls();
    const kinetic = balls.reduce((acc, b) => acc + 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy), 0);
    return { balls, kinetic };
  }

  private makeRackState(): StateVector {
    const r = this.params.radius;
    const gap = r * 2.15;
    const cx = 0.95;
    const cy = 0;

    const rack = [
      { x: cx, y: cy },
      { x: cx + gap, y: cy - gap * 0.5 },
      { x: cx + gap, y: cy + gap * 0.5 },
      { x: cx + gap * 2, y: cy - gap },
      { x: cx + gap * 2, y: cy },
      { x: cx + gap * 2, y: cy + gap },
    ];

    const state: number[] = [];
    state.push(-1.55, 0, this.params.cueSpeed, 0);
    for (let i = 1; i < BALL_COUNT; i += 1) {
      const p = rack[i];
      state.push(p.x, p.y, 0, 0);
    }
    return state;
  }

  private getBalls(): Ball[] {
    const balls: Ball[] = [];
    for (let i = 0; i < BALL_COUNT; i += 1) {
      const k = i * 4;
      balls.push({
        x: this.state[k],
        y: this.state[k + 1],
        vx: this.state[k + 2],
        vy: this.state[k + 3],
        r: this.params.radius,
        m: this.params.mass,
      });
    }
    return balls;
  }

  private resolveWall(b: Ball, minX: number, maxX: number, minY: number, maxY: number): number {
    const e = this.params.wallRestitution;
    let impact = 0;
    if (b.x - b.r < minX) {
      b.x = minX + b.r;
      impact = Math.max(impact, Math.abs(b.vx));
      b.vx = Math.abs(b.vx) * e;
    } else if (b.x + b.r > maxX) {
      b.x = maxX - b.r;
      impact = Math.max(impact, Math.abs(b.vx));
      b.vx = -Math.abs(b.vx) * e;
    }

    if (b.y - b.r < minY) {
      b.y = minY + b.r;
      impact = Math.max(impact, Math.abs(b.vy));
      b.vy = Math.abs(b.vy) * e;
    } else if (b.y + b.r > maxY) {
      b.y = maxY - b.r;
      impact = Math.max(impact, Math.abs(b.vy));
      b.vy = -Math.abs(b.vy) * e;
    }
    return impact;
  }

  private resolvePair(a: Ball, b: Ball): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const minDist = a.r + b.r;
    if (dist >= minDist) return 0;

    const nx = dist > 1e-6 ? dx / dist : 1;
    const ny = dist > 1e-6 ? dy / dist : 0;
    const overlap = minDist - Math.max(1e-6, dist);
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const rel = rvx * nx + rvy * ny;
    if (rel >= 0) return 0;

    const e = this.params.restitution;
    const impulse = (-(1 + e) * rel) / (1 / a.m + 1 / b.m);
    a.vx -= (impulse * nx) / a.m;
    a.vy -= (impulse * ny) / a.m;
    b.vx += (impulse * nx) / b.m;
    b.vy += (impulse * ny) / b.m;

    return Math.abs(rel);
  }
}
