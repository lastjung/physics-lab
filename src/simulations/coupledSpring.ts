import type { SimulationModel, StateVector } from '../core/types';

export interface CoupledSpringParams {
  mass1: number;
  mass2: number;
  k1: number;
  k2: number;
  damping: number;
  initialX1: number;
  initialX2: number;
  initialV1: number;
  initialV2: number;
}

const defaults: CoupledSpringParams = {
  mass1: 1,
  mass2: 1,
  k1: 14,
  k2: 10,
  damping: 0.25,
  initialX1: 0.25,
  initialX2: -0.18,
  initialV1: 0,
  initialV2: 0,
};

export class CoupledSpring implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: CoupledSpringParams;

  constructor(params: Partial<CoupledSpringParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX1, this.params.initialX2, this.params.initialV1, this.params.initialV2];
  }

  static getDefaultParams(): CoupledSpringParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const [x1, x2, v1, v2] = state;
    const { mass1, mass2, k1, k2, damping } = this.params;

    const a1 = (-k1 * x1 - k2 * (x1 - x2) - damping * v1) / mass1;
    const a2 = (-k2 * (x2 - x1) - damping * v2) / mass2;

    return [v1, v2, a1, a2];
  }

  reset(): void {
    this.state = [this.params.initialX1, this.params.initialX2, this.params.initialV1, this.params.initialV2];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CoupledSpringParams>(key: K, value: CoupledSpringParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CoupledSpringParams {
    return { ...this.params };
  }

  getKinematics() {
    const [x1, x2, v1, v2] = this.state;
    const { mass1, mass2, k1, k2 } = this.params;
    const kinetic = 0.5 * mass1 * v1 * v1 + 0.5 * mass2 * v2 * v2;
    const potential = 0.5 * k1 * x1 * x1 + 0.5 * k2 * (x2 - x1) * (x2 - x1);
    return { x1, x2, v1, v2, kinetic, potential, total: kinetic + potential };
  }
}
