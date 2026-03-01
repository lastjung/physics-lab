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
  armLength: number;
}

const defaults: RevoluteDemoParams = {
  motorEnabled: true,
  motorSpeed: 2.0,
  maxMotorTorque: 100.0,
  limitEnabled: false,
  lowerAngle: -Math.PI / 4,
  upperAngle: Math.PI / 4,
  gravity: 9.8,
  damping: 0.005,
  armLength: 0.4
};

export class RevoluteDemo implements SimulationModel {
  private state: StateVector = [0.4, 0, 0, 0, 0, 0]; // [x, y, vx, vy, angle, omega]
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
    const L = this.params.armLength;
    const theta = state[4];
    const omega = state[5];

    // 1. Angular acceleration (alpha) from gravity torque
    // Alpha = (g * cos(theta)) / L
    const alpha = (g * Math.cos(theta)) / L - d * omega;

    // 2. Kinematic derivatives
    // dx/dt = vx
    out[0] = -L * omega * Math.sin(theta);
    // dy/dt = vy
    out[1] = L * omega * Math.cos(theta);
    
    // dvx/dt = ax = -L * alpha * sin(theta) - L * omega^2 * cos(theta)
    out[2] = -L * alpha * Math.sin(theta) - L * omega * omega * Math.cos(theta);
    // dvy/dt = ay = L * alpha * cos(theta) - L * omega^2 * sin(theta)
    out[3] = L * alpha * Math.cos(theta) - L * omega * omega * Math.sin(theta);

    // dtheta/dt = omega
    out[4] = omega;
    // domega/dt = alpha
    out[5] = alpha;

    return out;
  }

  reset(): void {
    const L = this.params.armLength;
    this.state = [L, 0, 0, 0, 0, 0];
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
        localAnchorB: { x: -this.params.armLength, y: 0 },
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
        inertia: (this.params.armLength ** 2), 
        invInertia: 1 / (this.params.armLength ** 2)
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
      return {
          angle: this.state[4],
          speed: this.state[5]
      };
  }
}
