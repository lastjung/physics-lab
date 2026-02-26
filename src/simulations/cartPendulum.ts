import type { SimulationModel, StateVector } from '../core/types';

export interface CartPendulumParams {
  cartMass: number;
  bobMass: number;
  length: number;
  gravity: number;
  cartSpring: number;
  cartDamping: number;
  pendulumDamping: number;
  driveAmplitude: number;
  driveFrequency: number;
  initialX: number;
  initialTheta: number;
  initialVx: number;
  initialOmega: number;
}

const defaults: CartPendulumParams = {
  cartMass: 1.4,
  bobMass: 0.35,
  length: 0.85,
  gravity: 9.81,
  cartSpring: 1.8,
  cartDamping: 0.2,
  pendulumDamping: 0.045,
  driveAmplitude: 0,
  driveFrequency: 1.2,
  initialX: 0,
  initialTheta: 0.45,
  initialVx: 0,
  initialOmega: 0,
};

export class CartPendulum implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: CartPendulumParams;

  constructor(params: Partial<CartPendulumParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [this.params.initialX, this.params.initialTheta, this.params.initialVx, this.params.initialOmega];
  }

  static getDefaultParams(): CartPendulumParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, time: number): StateVector {
    const [x, theta, vx, omega] = state;
    const { cartMass: M, bobMass: m, length: l, gravity: g, cartSpring: k, cartDamping: c, pendulumDamping, driveAmplitude, driveFrequency } =
      this.params;

    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const drive = driveAmplitude * Math.sin(driveFrequency * time);
    const force = drive - k * x - c * vx;

    const denom = Math.max(0.12, M + m - m * cosT * cosT);
    const ax = (force + m * sinT * (l * omega * omega + g * cosT)) / denom;
    const alpha =
      (-(force * cosT) - m * l * omega * omega * sinT * cosT - (M + m) * g * sinT) / (l * denom) - pendulumDamping * omega;

    return [vx, omega, ax, alpha];
  }

  reset(): void {
    this.state = [this.params.initialX, this.params.initialTheta, this.params.initialVx, this.params.initialOmega];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CartPendulumParams>(key: K, value: CartPendulumParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CartPendulumParams {
    return { ...this.params };
  }

  getKinematics() {
    const [x, theta, vx, omega] = this.state;
    const { bobMass: m, cartMass: M, length: l, gravity: g } = this.params;

    const bobX = x + l * Math.sin(theta);
    const bobY = -l * Math.cos(theta);
    const bobVx = vx + l * omega * Math.cos(theta);
    const bobVy = l * omega * Math.sin(theta);

    const kineticCart = 0.5 * M * vx * vx;
    const kineticBob = 0.5 * m * (bobVx * bobVx + bobVy * bobVy);
    const potential = m * g * l * (1 - Math.cos(theta));

    return {
      x,
      theta,
      vx,
      omega,
      bobX,
      bobY,
      bobVx,
      bobVy,
      kinetic: kineticCart + kineticBob,
      potential,
      total: kineticCart + kineticBob + potential,
    };
  }
}
