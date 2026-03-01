import type { SimulationModel, StateVector } from '../core/types';

export interface RollerCoasterFlightParams {
  gravity: number;
  damping: number;
  trackAmplitude: number;
  trackFrequency: number;
  trackTilt: number;
  boundaryMode: number;
  boundaryRestitution: number;
  flightThreshold: number;
  initialX: number;
  initialVx: number;
}

const defaults: RollerCoasterFlightParams = {
  gravity: 9.81,
  damping: 0.035,
  trackAmplitude: 0.62,
  trackFrequency: 1.65,
  trackTilt: 0.03,
  boundaryMode: 0,
  boundaryRestitution: 0.82,
  flightThreshold: 0.0,
  initialX: -1.35,
  initialVx: 0,
};

export class RollerCoasterFlight implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: RollerCoasterFlightParams;
  private airborne = false;

  constructor(params: Partial<RollerCoasterFlightParams> = {}) {
    this.params = { ...defaults, ...params };
    const x = this.params.initialX;
    this.state = [x, this.params.initialVx, this.trackY(x), this.trackSlope(x) * this.params.initialVx];
  }

  static getDefaultParams(): RollerCoasterFlightParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [x, vx, y, vy] = state;
    if (!this.airborne) {
      const slope = this.trackSlope(x);
      const curvature = this.trackCurvature(x);
      const denom = 1 + slope * slope;
      const ax = (-this.params.gravity * slope - this.params.damping * vx - curvature * vx * vx) / denom;
      return [vx, ax, slope * vx, slope * ax + curvature * vx * vx];
    }
    return [vx, -this.params.damping * vx, vy, -this.params.gravity - this.params.damping * vy];
  }

  reset(): void {
    const x = this.params.initialX;
    const vx = this.params.initialVx;
    this.state = [x, vx, this.trackY(x), this.trackSlope(x) * vx];
    this.time = 0;
    this.airborne = false;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof RollerCoasterFlightParams>(key: K, value: RollerCoasterFlightParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): RollerCoasterFlightParams {
    return { ...this.params };
  }

  resolveBounds(minX: number, maxX: number): number {
    let impact = 0;
    const mode = this.params.boundaryMode;
    const e = this.params.boundaryRestitution;
    let [x, vx, y, vy] = this.state;
    const range = Math.max(0.001, maxX - minX);

    if (mode >= 0.5) {
      while (x < minX) x += range;
      while (x > maxX) x -= range;
      this.state = [x, vx, y, vy];
      return 0;
    }

    if (x < minX) {
      x = minX;
      impact = Math.max(impact, Math.abs(vx));
      vx = Math.abs(vx) * e;
    } else if (x > maxX) {
      x = maxX;
      impact = Math.max(impact, Math.abs(vx));
      vx = -Math.abs(vx) * e;
    }

    this.state = [x, vx, y, vy];
    return impact;
  }

  resolveFlightContact(): number {
    let [x, vx, y, vy] = this.state;
    const slope = this.trackSlope(x);
    const curvature = this.trackCurvature(x);
    const yTrack = this.trackY(x);

    if (!this.airborne) {
      const normalIndicator = this.params.gravity + curvature * vx * vx;
      if (normalIndicator < this.params.flightThreshold) {
        this.airborne = true;
      } else {
        y = yTrack;
        vy = slope * vx;
      }
      this.state = [x, vx, y, vy];
      return 0;
    }

    if (y <= yTrack) {
      const projected = (vx + slope * vy) / (1 + slope * slope);
      const trackVy = slope * projected;
      const impact = Math.hypot(vx - projected, vy - trackVy);
      x = x;
      vx = projected;
      y = yTrack;
      vy = trackVy;
      this.airborne = false;
      this.state = [x, vx, y, vy];
      return impact;
    }

    return 0;
  }

  isAirborne(): boolean {
    return this.airborne;
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
    const [x, vx, y, vy] = this.state;
    const speed = Math.hypot(vx, vy);
    const kinetic = 0.5 * speed * speed;
    const potential = this.params.gravity * (y + 1.8);
    return {
      x,
      y,
      vx,
      vy,
      speed,
      airborne: this.airborne,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }
}
