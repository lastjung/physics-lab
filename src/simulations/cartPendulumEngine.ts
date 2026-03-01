import type { SimulationModel, StateVector } from '../core/types';
import type { BodyState } from '../engine2d/collision/types';
import type { Joint } from '../engine2d/joints/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';

export interface CartPendulumEngineParams {
  cartMass: number;
  bobMass: number;
  length: number;
  gravity: number;
  cartSpring: number;
  cartDamping: number;
  linearDamping: number;
  angularDamping: number;
  driveAmplitude: number;
  driveFrequency: number;
  restitution: number;
  iterations: number;
  initialX: number;
  initialTheta: number;
  initialVx: number;
  initialOmega: number;
}

const defaults: CartPendulumEngineParams = {
  cartMass: 1.5,
  bobMass: 0.35,
  length: 0.9,
  gravity: 9.81,
  cartSpring: 1.9,
  cartDamping: 0.23,
  linearDamping: 0.03,
  angularDamping: 0.04,
  driveAmplitude: 0,
  driveFrequency: 1.2,
  restitution: 0.4,
  iterations: 14,
  initialX: 0,
  initialTheta: 0.45,
  initialVx: 0,
  initialOmega: 0,
};

const RAIL_Y = 0.45;
const RAIL_LIMIT = 2.2;
const CART_HALF_W = 0.24;
const CART_HALF_H = 0.1;

export class CartPendulumEngine implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: CartPendulumEngineParams;

  constructor(params: Partial<CartPendulumEngineParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = this.buildInitialState();
  }

  static getDefaultParams(): CartPendulumEngineParams {
    return { ...defaults };
  }

  private buildInitialState(): StateVector {
    const p = this.params;
    const cartX = p.initialX;
    const cartY = RAIL_Y;
    const pivotX = cartX;
    const pivotY = cartY - CART_HALF_H;

    const bobX = pivotX + p.length * Math.sin(p.initialTheta);
    const bobY = pivotY + p.length * Math.cos(p.initialTheta);

    const cartVx = p.initialVx;
    const bobVx = cartVx + p.length * p.initialOmega * Math.cos(p.initialTheta);
    const bobVy = -p.length * p.initialOmega * Math.sin(p.initialTheta);

    return [cartX, cartY, cartVx, 0, 0, 0, bobX, bobY, bobVx, bobVy, 0, 0];
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, time: number): StateVector {
    const p = this.params;
    const cartX = state[0];
    const cartVx = state[2];
    const bobVx = state[8];
    const bobVy = state[9];
    const bobOmega = state[11];

    const drive = p.driveAmplitude * Math.sin(p.driveFrequency * time);
    const cartAx = (drive - p.cartSpring * cartX - p.cartDamping * cartVx) / Math.max(0.05, p.cartMass);

    return [
      cartVx,
      0,
      cartAx,
      0,
      0,
      0,
      bobVx,
      bobVy,
      -p.linearDamping * bobVx,
      p.gravity - p.linearDamping * bobVy,
      bobOmega,
      -p.angularDamping * bobOmega,
    ];
  }

  reset(): void {
    this.state = this.buildInitialState();
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CartPendulumEngineParams>(key: K, value: CartPendulumEngineParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CartPendulumEngineParams {
    return { ...this.params };
  }

  setCartX(nextX: number): void {
    const x = Math.max(-RAIL_LIMIT, Math.min(RAIL_LIMIT, nextX));
    const prevX = this.state[0];
    const deltaX = x - prevX;

    this.state[0] = x;
    this.state[1] = RAIL_Y;
    this.state[2] = 0;
    this.state[3] = 0;
    this.state[4] = 0;
    this.state[5] = 0;

    this.state[6] += deltaX;
    this.state[8] = 0;
    this.state[9] = 0;
    this.state[11] = 0;
  }

  setBobPosition(x: number, y: number): void {
    this.state[6] = x;
    this.state[7] = y;
    this.state[8] = 0;
    this.state[9] = 0;
    this.state[10] = 0;
    this.state[11] = 0;
  }

  private buildBodies(): { rail: BodyState; cart: BodyState; bob: BodyState } {
    const p = this.params;
    const cartMass = Math.max(0.05, p.cartMass);
    const bobMass = Math.max(0.05, p.bobMass);
    const bobRadius = Math.max(0.045, 0.065 * Math.sqrt(bobMass));

    const rail: BodyState = {
      id: 'cp_rail',
      x: 0,
      y: RAIL_Y,
      vx: 0,
      vy: 0,
      mass: 0,
      invMass: 0,
      restitution: 0,
      radius: 0.01,
      friction: 0,
      shape: 'circle',
      angle: 0,
      omega: 0,
      inertia: 0,
      invInertia: 0,
    };

    const inertiaCart = Math.max(0.01, (cartMass * ((2 * CART_HALF_W) ** 2 + (2 * CART_HALF_H) ** 2)) / 12);
    const cart: BodyState = {
      id: 'cp_cart',
      x: this.state[0],
      y: this.state[1],
      vx: this.state[2],
      vy: this.state[3],
      mass: cartMass,
      invMass: 1 / cartMass,
      restitution: p.restitution,
      radius: 0,
      friction: 0.4,
      shape: 'aabb',
      halfW: CART_HALF_W,
      halfH: CART_HALF_H,
      angle: 0,
      omega: 0,
      inertia: inertiaCart,
      invInertia: 1 / inertiaCart,
    };

    const inertiaBob = Math.max(0.01, 0.5 * bobMass * bobRadius * bobRadius);
    const bob: BodyState = {
      id: 'cp_bob',
      x: this.state[6],
      y: this.state[7],
      vx: this.state[8],
      vy: this.state[9],
      mass: bobMass,
      invMass: 1 / bobMass,
      restitution: p.restitution,
      radius: bobRadius,
      friction: 0.25,
      shape: 'circle',
      angle: this.state[10],
      omega: this.state[11],
      inertia: inertiaBob,
      invInertia: 1 / inertiaBob,
    };

    return { rail, cart, bob };
  }

  private buildJoints(): Joint[] {
    return [
      {
        id: 'cp_prismatic',
        type: 'prismatic',
        bodyIdA: 'cp_rail',
        bodyIdB: 'cp_cart',
        localAnchorA: { x: 0, y: 0 },
        localAnchorB: { x: 0, y: 0 },
        localAxisA: { x: 1, y: 0 },
        referenceAngle: 0,
        limitEnabled: true,
        lowerTranslation: -RAIL_LIMIT,
        upperTranslation: RAIL_LIMIT,
      },
      {
        id: 'cp_rod',
        type: 'distance',
        bodyIdA: 'cp_cart',
        bodyIdB: 'cp_bob',
        localAnchorA: { x: 0, y: -CART_HALF_H },
        localAnchorB: { x: 0, y: 0 },
        length: this.params.length,
      },
    ];
  }

  resolveConstraints(): number {
    const { rail, cart, bob } = this.buildBodies();

    const res = stepCollisionPipeline([rail, cart, bob], {
      joints: this.buildJoints(),
      velocityIterations: this.params.iterations,
      positionIterations: this.params.iterations,
      beta: 0.24,
      dt: 1 / 120,
    });

    const xClamped = Math.max(-RAIL_LIMIT, Math.min(RAIL_LIMIT, cart.x));
    this.state[0] = xClamped;
    this.state[1] = RAIL_Y;
    this.state[2] = xClamped === cart.x ? cart.vx : -cart.vx * this.params.restitution;
    this.state[3] = 0;
    this.state[4] = 0;
    this.state[5] = 0;

    this.state[6] = bob.x;
    this.state[7] = bob.y;
    this.state[8] = bob.vx;
    this.state[9] = bob.vy;
    this.state[10] = bob.angle;
    this.state[11] = bob.omega;

    return res.impulse;
  }

  getKinematics() {
    const cartX = this.state[0];
    const cartY = this.state[1];
    const cartVx = this.state[2];

    const pivotX = cartX;
    const pivotY = cartY - CART_HALF_H;

    const bobX = this.state[6];
    const bobY = this.state[7];
    const bobVx = this.state[8];
    const bobVy = this.state[9];

    const dx = bobX - pivotX;
    const dy = bobY - pivotY;
    const rodLen = Math.max(1e-9, Math.hypot(dx, dy));

    const theta = Math.atan2(dx, dy);
    const relVx = bobVx - cartVx;
    const relVy = bobVy;
    const omega = (dx * relVy - dy * relVx) / Math.max(1e-8, dx * dx + dy * dy);

    const kineticCart = 0.5 * this.params.cartMass * cartVx * cartVx;
    const kineticBob = 0.5 * this.params.bobMass * (bobVx * bobVx + bobVy * bobVy);
    const potential = this.params.bobMass * this.params.gravity * Math.max(0, bobY - (RAIL_Y - 1.2));

    return {
      cartX,
      cartY,
      cartVx,
      pivotX,
      pivotY,
      bobX,
      bobY,
      bobVx,
      bobVy,
      theta,
      omega,
      rodErr: Math.abs(rodLen - this.params.length),
      railErr: Math.abs(cartY - RAIL_Y),
      kinetic: kineticCart + kineticBob,
      potential,
      total: kineticCart + kineticBob + potential,
    };
  }
}
