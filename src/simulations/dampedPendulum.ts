import type { SimulationModel, StateVector } from '../core/types';

export interface DampedPendulumParams {
  length: number;
  gravity: number;
  damping: number;
  mass: number;
  initialAngle: number;
  initialAngularVelocity: number;
}

const defaultParams: DampedPendulumParams = {
  length: 1.2,
  gravity: 9.81,
  damping: 0.12,
  mass: 1,
  initialAngle: 0.9,
  initialAngularVelocity: 0,
};

export class DampedPendulum implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: DampedPendulumParams;

  constructor(params: Partial<DampedPendulumParams> = {}) {
    this.params = { ...defaultParams, ...params };
    this.state = [this.params.initialAngle, this.params.initialAngularVelocity];
  }

  static getDefaultParams(): DampedPendulumParams {
    return { ...defaultParams };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, _time: number): StateVector {
    const [theta, omega] = state;
    const { gravity, length, damping } = this.params;

    const dTheta = omega;
    const dOmega = -(gravity / length) * Math.sin(theta) - damping * omega;
    return [dTheta, dOmega];
  }

  reset(): void {
    this.state = [this.params.initialAngle, this.params.initialAngularVelocity];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof DampedPendulumParams>(key: K, value: DampedPendulumParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): DampedPendulumParams {
    return { ...this.params };
  }

  getKinematics() {
    const [theta, omega] = this.state;
    const { length, mass, gravity } = this.params;
    const x = length * Math.sin(theta);
    const y = length * Math.cos(theta);
    const kinetic = 0.5 * mass * (length * omega) ** 2;
    const potential = mass * gravity * length * (1 - Math.cos(theta));
    return { theta, omega, x, y, kinetic, potential, total: kinetic + potential };
  }
}
