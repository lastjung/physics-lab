import type { SimulationModel, StateVector } from '../core/types';

export interface DrivenPendulumParams {
  length: number;
  gravity: number;
  damping: number;
  driveAmplitude: number;
  driveFrequency: number;
  initialAngle: number;
  initialAngularVelocity: number;
}

const defaults: DrivenPendulumParams = {
  length: 1.2,
  gravity: 9.81,
  damping: 0.08,
  driveAmplitude: 0.9,
  driveFrequency: 1.8,
  initialAngle: 0.7,
  initialAngularVelocity: 0,
};

export class DrivenPendulum implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: DrivenPendulumParams;

  constructor(params: Partial<DrivenPendulumParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialAngle, this.params.initialAngularVelocity];
  }

  static getDefaultParams(): DrivenPendulumParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, time: number): StateVector {
    const [theta, omega] = state;
    const { gravity, length, damping, driveAmplitude, driveFrequency } = this.params;
    const drive = driveAmplitude * Math.sin(driveFrequency * time);
    return [omega, -(gravity / length) * Math.sin(theta) - damping * omega + drive];
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

  setParam<K extends keyof DrivenPendulumParams>(key: K, value: DrivenPendulumParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): DrivenPendulumParams {
    return { ...this.params };
  }

  getKinematics() {
    const [theta, omega] = this.state;
    const { length, gravity } = this.params;
    const x = length * Math.sin(theta);
    const y = length * Math.cos(theta);
    const kinetic = 0.5 * (length * omega) ** 2;
    const potential = gravity * length * (1 - Math.cos(theta));
    return { theta, omega, x, y, kinetic, potential, total: kinetic + potential };
  }
}
