import type { SimulationModel, StateVector } from '../core/types';

export interface OrbitParams {
  mu: number;
  damping: number;
  initialX: number;
  initialY: number;
  initialVx: number;
  initialVy: number;
}

const defaults: OrbitParams = {
  mu: 9.5,
  damping: 0.003,
  initialX: 1.2,
  initialY: 0,
  initialVx: 0,
  initialVy: 2.6,
};

export class OrbitSim implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: OrbitParams;

  constructor(params: Partial<OrbitParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX, this.params.initialY, this.params.initialVx, this.params.initialVy];
  }

  static getDefaultParams(): OrbitParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [x, y, vx, vy] = state;
    const { mu, damping } = this.params;
    const r2 = x * x + y * y;
    const r = Math.max(0.15, Math.sqrt(r2));
    const a = -mu / (r * r * r);
    return [vx, vy, a * x - damping * vx, a * y - damping * vy];
  }

  reset(): void {
    this.state = [this.params.initialX, this.params.initialY, this.params.initialVx, this.params.initialVy];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof OrbitParams>(key: K, value: OrbitParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): OrbitParams {
    return { ...this.params };
  }

  getKinematics() {
    const [x, y, vx, vy] = this.state;
    const { mu } = this.params;
    const r = Math.max(0.15, Math.hypot(x, y));
    const kinetic = 0.5 * (vx * vx + vy * vy);
    const potential = -mu / r;
    return { x, y, vx, vy, r, kinetic, potential, total: kinetic + potential };
  }
}
