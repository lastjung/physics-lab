import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { Joint, WheelJoint } from '../engine2d/joints/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface WheelJointDemoParams {
  stiffness: number;
  damping: number;
  motorEnabled: boolean;
  motorSpeed: number;
  maxMotorTorque: number;
  gravity: number;
  subSteps: number;
}

const defaults: WheelJointDemoParams = {
  stiffness: 100.0,
  damping: 10.0,
  motorEnabled: true,
  motorSpeed: 5.0,
  maxMotorTorque: 50.0,
  gravity: 9.8,
  subSteps: 1
};

export class WheelJointDemo implements SimulationModel {
  private bodies: BodyState[] = [];
  private joints: Joint[] = [];
  private time = 0;
  private params: WheelJointDemoParams;

  constructor(params: Partial<WheelJointDemoParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): WheelJointDemoParams {
    return { ...defaults };
  }

  getState(): StateVector {
    const state: number[] = [];
    for (const b of this.bodies) {
      state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
    }
    return state;
  }

  setState(next: StateVector): void {
    let idx = 0;
    for (const b of this.bodies) {
      b.x = next[idx++];
      b.y = next[idx++];
      b.vx = next[idx++];
      b.vy = next[idx++];
      b.angle = next[idx++];
      b.omega = next[idx++];
    }
  }

  derivatives(state: StateVector): StateVector {
    const out = new Array(state.length).fill(0);
    // Gravity and simple damping are handled in resolveCollisions or simple integration
    // For this demo, we'll use a simple approach
    return out;
  }

  reset(): void {
    this.time = 0;
    const carW = 2.0;
    const carH = 0.5;
    const wheelR = 0.4;

    this.bodies = [
      // Chassis
      {
        id: 'chassis',
        x: 0, y: 2,
        vx: 0, vy: 0,
        mass: 2, invMass: 0.5,
        restitution: 0.2, friction: 0.3, shape: 'aabb',
        radius: 0,
        halfW: carW / 2, halfH: carH / 2,
        angle: 0, omega: 0,
        inertia: (2 * (carW**2 + carH**2)) / 12,
        invInertia: 12 / (2 * (carW**2 + carH**2))
      },
      // Front Wheel
      {
        id: 'wheelF',
        x: 0.8, y: 1.5,
        vx: 0, vy: 0,
        mass: 0.5, invMass: 2,
        restitution: 0.2, friction: 0.8, shape: 'circle',
        radius: wheelR,
        angle: 0, omega: 0,
        inertia: 0.5 * 0.5 * (wheelR**2),
        invInertia: 1 / (0.5 * 0.5 * (wheelR**2))
      },
      // Rear Wheel
      {
        id: 'wheelR',
        x: -0.8, y: 1.5,
        vx: 0, vy: 0,
        mass: 0.5, invMass: 2,
        restitution: 0.2, friction: 0.8, shape: 'circle',
        radius: wheelR,
        angle: 0, omega: 0,
        inertia: 0.5 * 0.5 * (wheelR**2),
        invInertia: 1 / (0.5 * 0.5 * (wheelR**2))
      },
      // Ground
      {
        id: 'ground',
        x: 0, y: 0,
        vx: 0, vy: 0,
        mass: 0, invMass: 0,
        restitution: 0.5, friction: 0.5, shape: 'aabb',
        radius: 0,
        halfW: 10, halfH: 0.2,
        angle: 0, omega: 0, inertia: 0, invInertia: 0
      }
    ];

    this.updateJoints();
  }

  private updateJoints() {
    this.joints = [
      {
        id: 'j-front',
        type: 'wheel',
        bodyIdA: 'chassis',
        bodyIdB: 'wheelF',
        localAnchorA: { x: 0.8, y: -0.3 },
        localAnchorB: { x: 0, y: 0 },
        localAxisA: { x: 0, y: -1 },
        stiffness: this.params.stiffness,
        damping: this.params.damping,
        motorEnabled: this.params.motorEnabled,
        motorSpeed: this.params.motorSpeed,
        maxMotorTorque: this.params.maxMotorTorque
      } as WheelJoint,
      {
        id: 'j-rear',
        type: 'wheel',
        bodyIdA: 'chassis',
        bodyIdB: 'wheelR',
        localAnchorA: { x: -0.8, y: -0.3 },
        localAnchorB: { x: 0, y: 0 },
        localAxisA: { x: 0, y: -1 },
        stiffness: this.params.stiffness,
        damping: this.params.damping,
        motorEnabled: this.params.motorEnabled,
        motorSpeed: this.params.motorSpeed,
        maxMotorTorque: this.params.maxMotorTorque
      } as WheelJoint
    ];
  }

  getTime(): number { return this.time; }
  setTime(time: number): void { this.time = time; }

  setParam<K extends keyof WheelJointDemoParams>(key: K, value: WheelJointDemoParams[K]): void {
    this.params = { ...this.params, [key]: value };
    this.updateJoints();
  }

  getParams(): WheelJointDemoParams { return { ...this.params }; }

  resolveCollisions(dt: number): number {
    const subStepDt = dt / this.params.subSteps;
    let totalImpulse = 0;

    for (let s = 0; s < this.params.subSteps; s++) {
      // 1. Apply gravity & simple integration
      for (const b of this.bodies) {
        if (b.invMass > 0) {
          b.vy -= this.params.gravity * subStepDt;
          b.x += b.vx * subStepDt;
          b.y += b.vy * subStepDt;
          b.angle += b.omega * subStepDt;
        }
      }

      // 2. Resolve collisions and joints
      const res = stepCollisionPipeline(this.bodies, {
        velocityIterations: 8,
        positionIterations: 3,
        joints: this.joints,
        dt: subStepDt
      });
      totalImpulse += res.impulse;
    }

    return totalImpulse;
  }
}
