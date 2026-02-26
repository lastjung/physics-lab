import type { SimulationModel, StateVector } from '../core/types';

export interface RollerCoasterTwoBallsParams {
  gravity: number;
  damping: number;
  trackAmplitude: number;
  trackFrequency: number;
  trackTilt: number;
  boundaryMode: number;
  boundaryRestitution: number;
  ballRestitution: number;
  radius: number;
  initialX1: number;
  initialVx1: number;
  initialX2: number;
  initialVx2: number;
}

const defaults: RollerCoasterTwoBallsParams = {
  gravity: 9.81,
  damping: 0.05,
  trackAmplitude: 0.55,
  trackFrequency: 1.35,
  trackTilt: 0.05,
  boundaryMode: 0,
  boundaryRestitution: 0.88,
  ballRestitution: 0.94,
  radius: 0.11,
  initialX1: -1.25,
  initialVx1: 0,
  initialX2: 0.55,
  initialVx2: 0,
};

export class RollerCoasterTwoBalls implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: RollerCoasterTwoBallsParams;

  constructor(params: Partial<RollerCoasterTwoBallsParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX1, this.params.initialVx1, this.params.initialX2, this.params.initialVx2];
  }

  static getDefaultParams(): RollerCoasterTwoBallsParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [x1, vx1, x2, vx2] = state;
    return [vx1, this.accel(x1, vx1), vx2, this.accel(x2, vx2)];
  }

  reset(): void {
    this.state = [this.params.initialX1, this.params.initialVx1, this.params.initialX2, this.params.initialVx2];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof RollerCoasterTwoBallsParams>(key: K, value: RollerCoasterTwoBallsParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): RollerCoasterTwoBallsParams {
    return { ...this.params };
  }

  setBallState(index: 1 | 2, x: number, vx: number): void {
    if (index === 1) {
      this.state[0] = x;
      this.state[1] = vx;
      return;
    }
    this.state[2] = x;
    this.state[3] = vx;
  }

  resolveBounds(minX: number, maxX: number): number {
    const mode = this.params.boundaryMode;
    if (mode >= 0.5) {
      const range = Math.max(0.001, maxX - minX);
      let [x1, vx1, x2, vx2] = this.state;
      while (x1 < minX) x1 += range;
      while (x1 > maxX) x1 -= range;
      while (x2 < minX) x2 += range;
      while (x2 > maxX) x2 -= range;
      this.state = [x1, vx1, x2, vx2];
      return 0;
    }

    const e = this.params.boundaryRestitution;
    let impact = 0;
    let [x1, vx1, x2, vx2] = this.state;

    if (x1 < minX) {
      x1 = minX;
      impact = Math.max(impact, Math.abs(vx1));
      vx1 = Math.abs(vx1) * e;
    } else if (x1 > maxX) {
      x1 = maxX;
      impact = Math.max(impact, Math.abs(vx1));
      vx1 = -Math.abs(vx1) * e;
    }

    if (x2 < minX) {
      x2 = minX;
      impact = Math.max(impact, Math.abs(vx2));
      vx2 = Math.abs(vx2) * e;
    } else if (x2 > maxX) {
      x2 = maxX;
      impact = Math.max(impact, Math.abs(vx2));
      vx2 = -Math.abs(vx2) * e;
    }

    this.state = [x1, vx1, x2, vx2];
    return impact;
  }

  resolveBallCollision(): number {
    let [x1, vx1, x2, vx2] = this.state;
    const minSep = this.params.radius * 2;
    const dx = x2 - x1;
    const dist = Math.abs(dx);
    if (dist >= minSep) return 0;

    const n = dist > 1e-6 ? dx / dist : 1;
    const overlap = minSep - dist;
    x1 -= n * overlap * 0.5;
    x2 += n * overlap * 0.5;

    const rel = (vx2 - vx1) * n;
    if (rel >= 0) {
      this.state = [x1, vx1, x2, vx2];
      return 0;
    }

    const e = this.params.ballRestitution;
    const impulse = -0.5 * (1 + e) * rel;
    vx1 -= impulse * n;
    vx2 += impulse * n;

    this.state = [x1, vx1, x2, vx2];
    return Math.abs(rel);
  }

  trackY(x: number): number {
    const { trackAmplitude: A, trackFrequency: w, trackTilt: tilt } = this.params;
    return A * Math.sin(w * x) + tilt * x;
  }

  trackSlope(x: number): number {
    const { trackAmplitude: A, trackFrequency: w, trackTilt: tilt } = this.params;
    return A * w * Math.cos(w * x) + tilt;
  }

  trackCurvature(x: number): number {
    const { trackAmplitude: A, trackFrequency: w } = this.params;
    return -A * w * w * Math.sin(w * x);
  }

  getKinematics() {
    const [x1, vx1, x2, vx2] = this.state;
    const y1 = this.trackY(x1);
    const y2 = this.trackY(x2);
    const s1 = this.trackSlope(x1);
    const s2 = this.trackSlope(x2);
    const vy1 = s1 * vx1;
    const vy2 = s2 * vx2;
    const speed1 = Math.hypot(vx1, vy1);
    const speed2 = Math.hypot(vx2, vy2);
    const kinetic = 0.5 * (speed1 * speed1 + speed2 * speed2);
    const potential = this.params.gravity * (y1 + y2 + 3.6);

    return {
      x1,
      vx1,
      y1,
      speed1,
      x2,
      vx2,
      y2,
      speed2,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }

  private accel(x: number, vx: number): number {
    const { gravity, damping } = this.params;
    const slope = this.trackSlope(x);
    const curvature = this.trackCurvature(x);
    const denom = 1 + slope * slope;
    return (-gravity * slope - damping * vx - curvature * vx * vx) / denom;
  }
}
