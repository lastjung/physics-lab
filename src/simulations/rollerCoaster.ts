import type { SimulationModel, StateVector } from '../core/types';

export interface RollerCoasterParams {
  gravity: number;
  damping: number;
  trackAmplitude: number;
  trackFrequency: number;
  trackTilt: number;
  boundaryRestitution: number;
  initialX: number;
  initialVx: number;
}

const defaults: RollerCoasterParams = {
  gravity: 9.81,
  damping: 0.04,
  trackAmplitude: 0.55,
  trackFrequency: 1.35,
  trackTilt: 0.05,
  boundaryRestitution: 0.85,
  initialX: -1.35,
  initialVx: 0,
};

export class RollerCoaster implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: RollerCoasterParams;

  constructor(params: Partial<RollerCoasterParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX, this.params.initialVx];
  }

  static getDefaultParams(): RollerCoasterParams {
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
    const { gravity, damping } = this.params;

    const slope = this.trackSlope(x);
    const curvature = this.trackCurvature(x);
    const denom = 1 + slope * slope;
    const ax = (-gravity * slope - damping * vx - curvature * vx * vx) / denom;

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

  setParam<K extends keyof RollerCoasterParams>(key: K, value: RollerCoasterParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): RollerCoasterParams {
    return { ...this.params };
  }

  resolveBounds(minX: number, maxX: number): number {
    let impact = 0;
    const e = this.params.boundaryRestitution;
    let [x, vx] = this.state;

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
    const kinetic = 0.5 * speed * speed;
    const potential = this.params.gravity * (y + 1.8);

    return {
      x,
      y,
      vx,
      vy,
      slope,
      speed,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }
}
