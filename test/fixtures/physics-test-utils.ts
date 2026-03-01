import { BodyState } from '../../src/engine2d/collision/types';

/**
 * Creates a standard dynamic circle for testing.
 */
export const createTestCircle = (id: string, x: number, y: number): BodyState => ({
  id,
  x,
  y,
  vx: 0,
  vy: 0,
  mass: 1,
  invMass: 1,
  restitution: 0.5,
  radius: 0.1,
  friction: 0.3,
  shape: 'circle',
  angle: 0,
  omega: 0,
  inertia: 1,
  invInertia: 1,
});

/**
 * Creates a standard static body for testing.
 */
export const createTestStatic = (id: string, x: number, y: number): BodyState => ({
  id,
  x,
  y,
  vx: 0,
  vy: 0,
  mass: 0,
  invMass: 0,
  restitution: 0.5,
  radius: 0.1,
  friction: 0.3,
  shape: 'circle',
  angle: 0,
  omega: 0,
  inertia: 0,
  invInertia: 0,
});

/**
 * Creates a standard dynamic box for testing.
 */
export const createTestBox = (id: string, x: number, y: number, w: number, h: number): BodyState => {
  const mass = 1;
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    mass,
    invMass: 1 / mass,
    restitution: 0.5,
    halfW: w / 2,
    halfH: h / 2,
    friction: 0.3,
    shape: 'aabb',
    radius: 0,
    angle: 0,
    omega: 0,
    inertia: (mass * (w * w + h * h)) / 12,
    invInertia: 12 / (mass * (w * w + h * h)),
  };
};
