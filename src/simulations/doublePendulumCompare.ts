import type { SimulationModel, StateVector } from '../core/types';

export interface DoublePendulumCompareParams {
  l1: number;
  l2: number;
  m1: number;
  m2: number;
  g: number;
  damping: number;
  initialTheta1: number;
  initialTheta2: number;
  epsilon: number;
  trailLength: number;
}

const defaults: DoublePendulumCompareParams = {
  l1: 1.0,
  l2: 1.0,
  m1: 1.0,
  m2: 1.0,
  g: 9.81,
  damping: 0.02,
  initialTheta1: 2.0,
  initialTheta2: 0.5,
  epsilon: 1e-4,
  trailLength: 200
};

export class DoublePendulumCompare implements SimulationModel {
  // State: [t1A, t2A, w1A, w2A, t1B, t2B, w1B, w2B]
  private state: StateVector = new Array(8).fill(0);
  private time = 0;
  private params: DoublePendulumCompareParams;

  constructor(params: Partial<DoublePendulumCompareParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): DoublePendulumCompareParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const out = new Array(8).fill(0);
    const derivA = this.singleDerivatives(state.slice(0, 4));
    const derivB = this.singleDerivatives(state.slice(4, 8));
    
    for (let i = 0; i < 4; i++) {
        out[i] = derivA[i];
        out[i + 4] = derivB[i];
    }
    return out;
  }

  private singleDerivatives(s: number[]): number[] {
    const [t1, t2, w1, w2] = s;
    const { l1, l2, m1, m2, g, damping } = this.params;

    const delta = t1 - t2;
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2);
    
    const dw1 = (
        -g * (2 * m1 + m2) * Math.sin(t1)
        -m2 * g * Math.sin(t1 - 2 * t2)
        -2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta))
    ) / (l1 * den) - damping * w1;

    const dw2 = (
        2 * Math.sin(delta) * (
            w1 * w1 * l1 * (m1 + m2)
            + g * (m1 + m2) * Math.cos(t1)
            + w2 * w2 * l2 * m2 * Math.cos(delta)
        )
    ) / (l2 * den) - damping * w2;

    return [w1, w2, dw1, dw2];
  }

  reset(): void {
    const { initialTheta1, initialTheta2, epsilon } = this.params;
    this.state = [
        initialTheta1, initialTheta2, 0, 0,
        initialTheta1 + epsilon, initialTheta2, 0, 0
    ];
    this.time = 0;
  }

  syncReset(): void {
    const { initialTheta1, initialTheta2 } = this.params;
    this.state = [
      initialTheta1, initialTheta2, 0, 0,
      initialTheta1, initialTheta2, 0, 0
    ];
    this.time = 0;
  }

  getTime(): number { return this.time; }
  setTime(time: number): void { this.time = time; }

  setParam<K extends keyof DoublePendulumCompareParams>(key: K, value: DoublePendulumCompareParams[K]): void {
    this.params = { ...this.params, [key]: value };
    if (['initialTheta1', 'initialTheta2', 'epsilon'].includes(key)) {
        this.reset();
    }
  }

  getParams(): DoublePendulumCompareParams { return { ...this.params }; }

  getStats() {
    const [t1A, t2A, w1A, w2A, t1B, t2B, w1B, w2B] = this.state;
    const dt1 = t1A - t1B;
    const dt2 = t2A - t2B;
    const dw1 = w1A - w1B;
    const dw2 = w2A - w2B;

    // Euclidean distance in phase space
    const distance = Math.sqrt(dt1*dt1 + dt2*dt2 + dw1*dw1 + dw2*dw2);
    
    // Lyapunov approximation: L = log(d(t)/d(0)) / t
    const d0 = this.params.epsilon || 1e-9;
    const lyapunov = this.time > 0.1 ? Math.log(Math.max(1e-12, distance / d0)) / this.time : 0;

    return {
        distance,
        dt1,
        dt2,
        lyapunov
    };
  }

  getPositions() {
    const { l1, l2 } = this.params;
    const [t1A, t2A, , , t1B, t2B] = this.state;

    const x1A = l1 * Math.sin(t1A);
    const y1A = l1 * Math.cos(t1A);
    const x2A = x1A + l2 * Math.sin(t2A);
    const y2A = y1A + l2 * Math.cos(t2A);

    const x1B = l1 * Math.sin(t1B);
    const y1B = l1 * Math.cos(t1B);
    const x2B = x1B + l2 * Math.sin(t2B);
    const y2B = y1B + l2 * Math.cos(t2B);

    return {
        a: { x1: x1A, y1: y1A, x2: x2A, y2: y2A },
        b: { x1: x1B, y1: y1B, x2: x2B, y2: y2B }
    };
  }

  setAngles(index: 0 | 1, t1: number, t2: number) {
    const offset = index * 4;
    this.state[offset] = t1;
    this.state[offset + 1] = t2;
    this.state[offset + 2] = 0; // Stop velocity while dragging
    this.state[offset + 3] = 0;

    // Optional: Synchronize initial state if dragging Pendulum A
    if (index === 0) {
      this.params.initialTheta1 = t1;
      this.params.initialTheta2 = t2;
    }
  }
}
