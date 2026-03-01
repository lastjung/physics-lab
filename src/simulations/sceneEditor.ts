import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody } from '../engine2d/collision/bodyFactory';
import { Joint } from '../engine2d/joints/types';

export interface SceneEditorParams {
  gravity: number;
}

const defaultParams: SceneEditorParams = {
  gravity: 9.8,
};

export class SceneEditorSimulation implements SimulationModel {
  private bodies: BodyState[] = [];
  private joints: Joint[] = [];
  private time = 0;
  private params: SceneEditorParams;

  constructor(params: Partial<SceneEditorParams> = {}) {
    this.params = { ...defaultParams, ...params };
    this.reset();
  }

  static getDefaultParams(): SceneEditorParams {
    return { ...defaultParams };
  }

  // Implementation follows the pattern of other Engine2D simulations
  // but with dynamic body/joint addition capabilities
  
  getState(): StateVector {
    // [x1, y1, vx1, vy1, r1, w1, ...]
    const state: number[] = [];
    for (const b of this.bodies) {
      state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
    }
    return state;
  }

  setState(next: StateVector): void {
    let cursor = 0;
    for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        b.x = next[cursor++];
        b.y = next[cursor++];
        b.vx = next[cursor++];
        b.vy = next[cursor++];
        b.angle = next[cursor++];
        b.omega = next[cursor++];
    }
  }

  derivatives(state: StateVector, _time: number): StateVector {
    const deriv: number[] = [];
    for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        const vx = state[i * 6 + 2];
        const vy = state[i * 6 + 3];
        const omega = state[i * 6 + 5];

        // Only gravity
        let ax = 0;
        let ay = b.invMass > 0 ? this.params.gravity : 0;
        let alpha = 0;

        deriv.push(vx, vy, ax, ay, omega, alpha);
    }
    return deriv;
  }

  resolveCollisions(): void {
    stepCollisionPipeline(this.bodies, { joints: this.joints });
  }

  reset(): void {
    this.bodies = [];
    this.joints = [];
    this.time = 0;

    // Default floor
    const floor = createBody('floor', 4.0, 0.2, { isStatic: true });
    floor.y = -1.5;
    this.bodies.push(floor);
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof SceneEditorParams>(key: K, value: SceneEditorParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): SceneEditorParams {
    return { ...this.params };
  }

  // --- Scaffold specific: Add Object ---
  addCircle(x: number, y: number, radius: number): void {
      const circle = createBody(`circle_${Date.now()}`, radius * 2, radius * 2, { radius });
      circle.x = x;
      circle.y = y;
      this.bodies.push(circle);
  }

  getBodies(): BodyState[] {
      return this.bodies;
  }

  getJoints(): Joint[] {
      return this.joints;
  }
}
