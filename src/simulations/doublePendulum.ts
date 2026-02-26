import type { SimulationModel, StateVector } from '../core/types';

export interface DoublePendulumParams {
  length1: number;
  length2: number;
  mass1: number;
  mass2: number;
  gravity: number;
  damping: number;
  initialTheta1: number;
  initialTheta2: number;
  initialOmega1: number;
  initialOmega2: number;
}

const defaultParams: DoublePendulumParams = {
  length1: 1.05,
  length2: 0.95,
  mass1: 1,
  mass2: 1,
  gravity: 9.81,
  damping: 0.03,
  initialTheta1: 1.1,
  initialTheta2: 0.8,
  initialOmega1: 0,
  initialOmega2: 0,
};

export class DoublePendulum implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: DoublePendulumParams;

  constructor(params: Partial<DoublePendulumParams> = {}) {
    this.params = { ...defaultParams, ...params };
    this.state = [
      this.params.initialTheta1,
      this.params.initialTheta2,
      this.params.initialOmega1,
      this.params.initialOmega2,
    ];
  }

  static getDefaultParams(): DoublePendulumParams {
    return { ...defaultParams };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, _time: number): StateVector {
    const [theta1, theta2, omega1, omega2] = state;
    const { length1: l1, length2: l2, mass1: m1, mass2: m2, gravity: g, damping } = this.params;

    const dTheta1 = omega1;
    const dTheta2 = omega2;

    const delta = theta1 - theta2;
    const denom1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
    const denom2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));

    const num1 =
      -g * (2 * m1 + m2) * Math.sin(theta1) -
      m2 * g * Math.sin(theta1 - 2 * theta2) -
      2 * Math.sin(delta) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta));

    const num2 =
      2 *
      Math.sin(delta) *
      (omega1 * omega1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(theta1) +
        omega2 * omega2 * l2 * m2 * Math.cos(delta));

    const dOmega1 = num1 / denom1 - damping * omega1;
    const dOmega2 = num2 / denom2 - damping * omega2;

    return [dTheta1, dTheta2, dOmega1, dOmega2];
  }

  reset(): void {
    this.state = [this.params.initialTheta1, this.params.initialTheta2, this.params.initialOmega1, this.params.initialOmega2];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof DoublePendulumParams>(key: K, value: DoublePendulumParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): DoublePendulumParams {
    return { ...this.params };
  }

  getKinematics() {
    const [theta1, theta2, omega1, omega2] = this.state;
    const { length1: l1, length2: l2, mass1: m1, mass2: m2, gravity: g } = this.params;

    const x1 = l1 * Math.sin(theta1);
    const y1 = l1 * Math.cos(theta1);
    const x2 = x1 + l2 * Math.sin(theta2);
    const y2 = y1 + l2 * Math.cos(theta2);

    const v1sq = (l1 * omega1) ** 2;
    const v2sq =
      v1sq +
      (l2 * omega2) ** 2 +
      2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2);

    const kinetic = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;
    const potential = m1 * g * y1 + m2 * g * y2;

    return {
      theta1,
      theta2,
      omega1,
      omega2,
      x1,
      y1,
      x2,
      y2,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }
}
