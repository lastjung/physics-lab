import type { SimulationModel, StateVector } from '../core/types';

export interface RollerCoasterSpringParams {
  gravity: number;
  damping: number;
  trackAmplitude: number;
  trackFrequency: number;
  trackTilt: number;
  boundaryMode: number;
  boundaryRestitution: number;
  springK: number;
  springDamping: number;
  springRestX: number;
  initialX: number;
  initialVx: number;
}

const defaults: RollerCoasterSpringParams = {
  gravity: 9.81,
  damping: 0.035,
  trackAmplitude: 0.55,
  trackFrequency: 1.35,
  trackTilt: 0.05,
  boundaryMode: 0,
  boundaryRestitution: 0.85,
  springK: 10.0,
  springDamping: 0.3,
  springRestX: 0,
  initialX: -1.2,
  initialVx: 0,
};

export class RollerCoasterSpring implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: RollerCoasterSpringParams;

  constructor(params: Partial<RollerCoasterSpringParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX, this.params.initialVx];
  }

  static getDefaultParams(): RollerCoasterSpringParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [x, vx] = state;
    const slope = this.trackSlope(x);
    const curvature = this.trackCurvature(x);
    const denom = 1 + slope * slope;
    const gravityTerm = -this.params.gravity * slope;
    const dampingTerm = -this.params.damping * vx;
    const geometricTerm = -curvature * vx * vx;
    const springTerm = -this.params.springK * (x - this.params.springRestX) - this.params.springDamping * vx;
    const ax = (gravityTerm + dampingTerm + geometricTerm + springTerm) / denom;
    return [vx, ax];
  }

  reset(): void {
    this.state = [this.params.initialX, this.params.initialVx];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof RollerCoasterSpringParams>(key: K, value: RollerCoasterSpringParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): RollerCoasterSpringParams {
    return { ...this.params };
  }

  resolveBounds(minX: number, maxX: number): number {
    let impact = 0;
    const e = this.params.boundaryRestitution;
    const mode = this.params.boundaryMode;
    let [x, vx] = this.state;
    const range = Math.max(0.001, maxX - minX);

    if (mode >= 0.5) {
      while (x < minX) x += range;
      while (x > maxX) x -= range;
      this.state[0] = x;
      this.state[1] = vx;
      return 0;
    }

    if (x < minX) {
      x = minX;
      impact = Math.abs(vx);
      vx = Math.abs(vx) * e;
    } else if (x > maxX) {
      x = maxX;
      impact = Math.abs(vx);
      vx = -Math.abs(vx) * e;
    }

    this.state[0] = x;
    this.state[1] = vx;
    return impact;
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
    const [x, vx] = this.state;
    const y = this.trackY(x);
    const slope = this.trackSlope(x);
    const vy = slope * vx;
    const speed = Math.hypot(vx, vy);
    const springDx = x - this.params.springRestX;
    const kinetic = 0.5 * speed * speed;
    const potential = this.params.gravity * (y + 1.8);
    const springEnergy = 0.5 * this.params.springK * springDx * springDx;

    return {
      x,
      y,
      vx,
      vy,
      speed,
      springDx,
      kinetic,
      potential,
      springEnergy,
      total: kinetic + potential + springEnergy,
    };
  }
}
