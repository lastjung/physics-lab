import type { SimulationModel, StateVector } from '../core/types';

export interface SpringMassParams {
  mass: number;
  stiffness: number;
  damping: number;
  initialDisplacement: number;
  initialVelocity: number;
}

const defaultParams: SpringMassParams = {
  mass: 1,
  stiffness: 18,
  damping: 0.35,
  initialDisplacement: 0.45,
  initialVelocity: 0,
};

export class SpringMass implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: SpringMassParams;

  constructor(params: Partial<SpringMassParams> = {}) {
    this.params = { ...defaultParams, ...params };
    this.state = [this.params.initialDisplacement, this.params.initialVelocity];
  }

  static getDefaultParams(): SpringMassParams {
    return { ...defaultParams };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, _time: number): StateVector {
    const [x, v] = state;
    const { mass, stiffness, damping } = this.params;
    return [v, -(stiffness / mass) * x - (damping / mass) * v];
  }

  reset(): void {
    this.state = [this.params.initialDisplacement, this.params.initialVelocity];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof SpringMassParams>(key: K, value: SpringMassParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): SpringMassParams {
    return { ...this.params };
  }

  getKinematics() {
    const [x, v] = this.state;
    const { mass, stiffness } = this.params;
    const kinetic = 0.5 * mass * v * v;
    const potential = 0.5 * stiffness * x * x;
    return { x, v, kinetic, potential, total: kinetic + potential };
  }
}
