import type { SimulationModel, StateVector } from '../core/types';

export interface NewtonsCradleParams {
  mass: number;
  radius: number;
  spacing: number;
  stiffness: number;
  damping: number;
  restitution: number;
  initialX1: number;
  initialX5: number;
  initialV1: number;
  initialV5: number;
}

const BALL_COUNT = 5;

const defaults: NewtonsCradleParams = {
  mass: 1,
  radius: 0.12,
  spacing: 0.241,
  stiffness: 14,
  damping: 0.03,
  restitution: 0.992,
  initialX1: -0.46,
  initialX5: 0,
  initialV1: 0,
  initialV5: 0,
};

export class NewtonsCradle implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: NewtonsCradleParams;

  constructor(params: Partial<NewtonsCradleParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = this.makeInitialState();
  }

  static getDefaultParams(): NewtonsCradleParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const result: number[] = new Array(BALL_COUNT * 2).fill(0);
    const { mass, stiffness, damping } = this.params;

    for (let i = 0; i < BALL_COUNT; i += 1) {
      const x = state[i];
      const v = state[BALL_COUNT + i];
      result[i] = v;
      result[BALL_COUNT + i] = (-stiffness * x - damping * v) / mass;
    }

    return result;
  }

  reset(): void {
    this.state = this.makeInitialState();
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof NewtonsCradleParams>(key: K, value: NewtonsCradleParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): NewtonsCradleParams {
    return { ...this.params };
  }

  setBallState(index: number, displacement: number, velocity: number): void {
    if (index < 0 || index >= BALL_COUNT) return;
    this.state[index] = displacement;
    this.state[BALL_COUNT + index] = velocity;
  }

  resolveCollisions(): number {
    const { radius, restitution, mass } = this.params;
    const anchor = this.getAnchorX();
    const x = this.state.slice(0, BALL_COUNT);
    const v = this.state.slice(BALL_COUNT, BALL_COUNT * 2);
    let maxImpact = 0;
    const minDistance = radius * 2;
    const solvePass = () => {
      for (let i = 0; i < BALL_COUNT - 1; i += 1) {
        const left = anchor[i] + x[i];
        const right = anchor[i + 1] + x[i + 1];
        const gap = right - left;
        if (gap >= minDistance) continue;

        const overlap = minDistance - gap;
        // Small bias helps prevent persistent interpenetration/jitter.
        const correction = overlap * 0.5 + 1e-4;
        x[i] -= correction;
        x[i + 1] += correction;

        const relative = v[i + 1] - v[i];
        if (relative >= 0) continue;

        const impulse = (-(1 + restitution) * relative) / (1 / mass + 1 / mass);
        v[i] -= impulse / mass;
        v[i + 1] += impulse / mass;
        maxImpact = Math.max(maxImpact, Math.abs(relative));
      }
    };

    for (let pass = 0; pass < 3; pass += 1) {
      solvePass();
    }

    for (let i = 0; i < BALL_COUNT; i += 1) {
      this.state[i] = x[i];
      this.state[BALL_COUNT + i] = v[i];
    }

    return maxImpact;
  }

  getKinematics() {
    const x = this.state.slice(0, BALL_COUNT);
    const v = this.state.slice(BALL_COUNT, BALL_COUNT * 2);
    const anchorX = this.getAnchorX();
    const worldX = x.map((d, i) => anchorX[i] + d);
    const speed = v.map((vv) => Math.abs(vv));
    const kinetic = v.reduce((acc, vv) => acc + 0.5 * this.params.mass * vv * vv, 0);
    const potential = x.reduce((acc, xx) => acc + 0.5 * this.params.stiffness * xx * xx, 0);
    return {
      x,
      v,
      worldX,
      speed,
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }

  getAnchorX(): number[] {
    const { spacing } = this.params;
    const center = (BALL_COUNT - 1) * 0.5;
    return Array.from({ length: BALL_COUNT }, (_, i) => (i - center) * spacing);
  }

  private makeInitialState(): StateVector {
    return [
      this.params.initialX1,
      0,
      0,
      0,
      this.params.initialX5,
      this.params.initialV1,
      0,
      0,
      0,
      this.params.initialV5,
    ];
  }
}
