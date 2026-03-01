import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { Joint, RevoluteJoint } from '../engine2d/joints/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface RevoluteDemoParams {
  motorEnabled: boolean;
  motorSpeed: number;
  maxMotorTorque: number;
  limitEnabled: boolean;
  lowerAngle: number;
  upperAngle: number;
  gravity: number;
  damping: number;
}

const defaults: RevoluteDemoParams = {
  motorEnabled: true,
  motorSpeed: 2.0,
  maxMotorTorque: 50.0,
  limitEnabled: false,
  lowerAngle: -Math.PI / 4,
  upperAngle: Math.PI / 4,
  gravity: 9.8,
  damping: 0.1
};

export class RevoluteDemo implements SimulationModel {
  private state: StateVector = [0, 0, 0, 0, 0, 0]; // [x, y, vx, vy, angle, omega]
  private time = 0;
  private params: RevoluteDemoParams;
  private joints: Joint[] = [];

  constructor(params: Partial<RevoluteDemoParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): RevoluteDemoParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const out = new Array(state.length).fill(0);
    const g = this.params.gravity;
    const d = this.params.damping;

    // x, y derivatives
    out[0] = state[2];
    out[1] = state[3];

    // vx, vy (gravity + damping)
    out[2] = -d * state[2];
    out[3] = g - d * state[3];

    // angle derivative
    out[4] = state[5];
    
    // omega derivative (gravity torque + damping)
    // For a simple pendulum-like arm, torque = -m * g * L * sin(theta)
    // But we let the joint solver handle the constraint forces.
    out[5] = -d * state[5];

    return out;
  }

  reset(): void {
    // Arm at (0, 0.4) initially, fixed base at (0, 0)
    // Body state: [x, y, vx, vy, angle, omega]
    this.state = [0.4, 0, 0, 0, 0, 0];
    this.time = 0;
    this.updateJoints();
  }

  private updateJoints() {
    this.joints = [
      {
        id: 'revolute-j1',
        type: 'revolute',
        bodyIdA: 'base',
        bodyIdB: 'arm',
        localAnchorA: { x: 0, y: 0 },
        localAnchorB: { x: -0.4, y: 0 },
        motorEnabled: this.params.motorEnabled,
        motorSpeed: this.params.motorSpeed,
        maxMotorTorque: this.params.maxMotorTorque,
        limitEnabled: this.params.limitEnabled,
        lowerAngle: this.params.lowerAngle,
        upperAngle: this.params.upperAngle,
        referenceAngle: 0
      } as RevoluteJoint
    ];
  }

  getTime(): number { return this.time; }
  setTime(time: number): void { this.time = time; }

  setParam<K extends keyof RevoluteDemoParams>(key: K, value: RevoluteDemoParams[K]): void {
    this.params = { ...this.params, [key]: value };
    this.updateJoints();
  }

  getParams(): RevoluteDemoParams { return { ...this.params }; }

  resolveCollisions(): number {
    const bodies: BodyState[] = [
      {
        id: 'base',
        x: 0, y: 0,
        vx: 0, vy: 0,
        mass: 0, invMass: 0,
        restitution: 0.5, radius: 0.1, friction: 0.3, shape: 'circle',
        angle: 0, omega: 0, inertia: 0, invInertia: 0
      },
      {
        id: 'arm',
        x: this.state[0], y: this.state[1],
        vx: this.state[2], vy: this.state[3],
        mass: 1, invMass: 1,
        restitution: 0.5, radius: 0.05, friction: 0.3, shape: 'circle',
        angle: this.state[4], omega: this.state[5],
        inertia: 0.5 * 1 * 0.16, // approximate
        invInertia: 1 / (0.5 * 1 * 0.16)
      }
    ];

    const res = stepCollisionPipeline(bodies, {
      velocityIterations: 10,
      positionIterations: 10,
      joints: this.joints,
      dt: 1/120
    });

    // Update state
    const arm = bodies[1];
    this.state[0] = arm.x;
    this.state[1] = arm.y;
    this.state[2] = arm.vx;
    this.state[3] = arm.vy;
    this.state[4] = arm.angle;
    this.state[5] = arm.omega;

    return res.impulse;
  }

  getJointState() {
      const joint = this.joints[0] as RevoluteJoint;
      // relAngle = (angleB - angleA) - ref
      // Since angleA is 0 and ref is 0
      return {
          angle: this.state[4],
          speed: this.state[5]
      };
  }
}
