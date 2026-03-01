import { describe, expect, it } from 'vitest';

import { Billiards } from '../src/simulations/billiards';
import { CarSuspension } from '../src/simulations/carSuspension';
import { CartPendulum } from '../src/simulations/cartPendulum';
import { CartPendulumEngine } from '../src/simulations/cartPendulumEngine';
import { CollidingBlocks } from '../src/simulations/collidingBlocks';
import { DoublePendulumEngine } from '../src/simulations/doublePendulumEngine';
import { NewtonsCradle } from '../src/simulations/newtonsCradle';
import { PolygonShapes } from '../src/simulations/polygonShapes';
import { RollerCoaster } from '../src/simulations/rollerCoaster';
import { RollerCoasterFlight } from '../src/simulations/rollerCoasterFlight';
import { RollerCoasterSpring } from '../src/simulations/rollerCoasterSpring';
import { RollerCoasterTwoBalls } from '../src/simulations/rollerCoasterTwoBalls';

describe('New simulations sanity', () => {
  it("Newton's Cradle exchanges momentum after collision resolution", () => {
    const sim = new NewtonsCradle({ initialX1: -0.56, restitution: 0.995, damping: 0 });
    sim.setState([0.12, 0, 0, 0, 0, 1.4, 0, 0, 0, 0]);
    const impact = sim.resolveCollisions();
    const k = sim.getKinematics();

    expect(impact).toBeGreaterThan(0);
    expect(k.v[1]).toBeGreaterThan(0);
  });

  it('Cart + Pendulum derivatives remain finite near upright', () => {
    const sim = new CartPendulum({ initialTheta: 0.1, driveAmplitude: 0.4 });
    const d = sim.derivatives([0, 0.1, 0.2, -0.3], 0.25);

    expect(d.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('Roller Coaster keeps car on track function and resolves boundary bounce', () => {
    const sim = new RollerCoaster({ initialX: 2.7, initialVx: 1.4, boundaryRestitution: 0.8 });
    const hit = sim.resolveBounds(-2.4, 2.4);
    const k = sim.getKinematics();

    expect(hit).toBeGreaterThan(0);
    expect(k.x).toBeLessThanOrEqual(2.4);
    expect(k.y).toBeCloseTo(sim.trackY(k.x), 6);
  });

  it('Billiards resolves a head-on collision', () => {
    const sim = new Billiards({ restitution: 0.98, linearDamping: 0 });
    const r = sim.getParams().radius;
    sim.setBallState(0, -0.2, 0, 1.4, 0);
    sim.setBallState(1, -0.2 + r * 1.7, 0, 0, 0);
    const impact = sim.resolveCollisions(-2.2, 2.2, -1.05, 1.05);
    const k = sim.getKinematics();

    expect(impact).toBeGreaterThan(0);
    expect(Math.abs(k.balls[1].vx)).toBeGreaterThan(0.1);
  });

  it('Car Suspension derivatives remain finite for road forcing', () => {
    const sim = new CarSuspension({ roadAmplitude: 0.09, roadFrequency: 1.6 });
    const d = sim.derivatives([0.02, -0.01, 0.3, -0.2], 0.4);

    expect(d.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('Roller Coaster wrap mode teleports across boundary without bounce', () => {
    const sim = new RollerCoaster({ boundaryMode: 1, initialX: 2.9, initialVx: 1.1 });
    const hit = sim.resolveBounds(-2.4, 2.4);
    const k = sim.getKinematics();

    expect(hit).toBe(0);
    expect(k.x).toBeGreaterThanOrEqual(-2.4);
    expect(k.x).toBeLessThanOrEqual(2.4);
  });

  it('Coaster Two Balls resolves inter-ball collision', () => {
    const sim = new RollerCoasterTwoBalls({ ballRestitution: 0.98 });
    sim.setState([-0.05, 1.2, 0.05, -0.4]);
    const impact = sim.resolveBallCollision();
    const k = sim.getKinematics();

    expect(impact).toBeGreaterThan(0);
    expect(k.vx1).toBeLessThan(1.2);
    expect(k.vx2).toBeGreaterThan(-0.4);
  });

  it('Coaster Spring includes spring energy and boundary bounce', () => {
    const sim = new RollerCoasterSpring({ springK: 14, initialX: 2.8, initialVx: 1.2 });
    const hit = sim.resolveBounds(-2.4, 2.4);
    const k = sim.getKinematics();

    expect(hit).toBeGreaterThan(0);
    expect(k.springEnergy).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(k.total)).toBe(true);
  });

  it('Coaster Flight can transition to airborne mode', () => {
    const sim = new RollerCoasterFlight({
      trackAmplitude: 0.9,
      trackFrequency: 2.2,
      initialX: -0.2,
      initialVx: 4.8,
      flightThreshold: 0.5,
    });
    sim.resolveFlightContact();
    const k = sim.getKinematics();

    expect(Number.isFinite(k.x)).toBe(true);
    expect(Number.isFinite(k.y)).toBe(true);
    expect(typeof k.airborne).toBe('boolean');
  });

  it('Colliding Blocks resolves wall constraints', () => {
    const sim = new CollidingBlocks({ rows: 1, cols: 1, blockSize: 0.2 });
    sim.setState([2.7, 0, 2.0, 0]);
    const impact = sim.resolveCollisions(-2.3, 2.3, -1.05, 1.35);
    const blocks = sim.getBlocks();

    expect(impact).toBeGreaterThan(0);
    expect(blocks[0].x).toBeLessThanOrEqual(2.3);
  });

  it('Polygon Shapes resolves SAT collisions with finite state', () => {
    const sim = new PolygonShapes({ restitution: 0.7, friction: 0.2 });
    const b = { minX: -2.3, maxX: 2.3, minY: -1.05, maxY: 1.45 };
    const impact = sim.resolveCollisions(b.minX, b.maxX, b.minY, b.maxY);
    const k = sim.getKinematics();

    expect(impact).toBeGreaterThanOrEqual(0);
    expect(k.count).toBeGreaterThan(0);
    expect(Number.isFinite(k.kinetic)).toBe(true);
    expect(Number.isFinite(k.maxSpeed)).toBe(true);
  });

  it('Double Pendulum Engine keeps link constraints bounded', () => {
    const sim = new DoublePendulumEngine({ iterations: 16, damping: 0.03 });
    for (let i = 0; i < 40; i += 1) {
      const state = sim.getState();
      const next = sim.derivatives(state).map((d, idx) => state[idx] + d * (1 / 120));
      sim.setState(next);
      sim.resolveConstraints();
      sim.setTime(sim.getTime() + 1 / 120);
    }
    const k = sim.getKinematics();

    expect(Number.isFinite(k.total)).toBe(true);
    expect(k.lenErr1).toBeLessThan(0.08);
    expect(k.lenErr2).toBeLessThan(0.08);
  });

  it('Cart + Pendulum Engine keeps rod constraint bounded', () => {
    const sim = new CartPendulumEngine({ iterations: 16, driveAmplitude: 0.8, driveFrequency: 1.1 });
    for (let i = 0; i < 40; i += 1) {
      const state = sim.getState();
      const next = sim.derivatives(state, sim.getTime()).map((d, idx) => state[idx] + d * (1 / 120));
      sim.setState(next);
      sim.resolveConstraints();
      sim.setTime(sim.getTime() + 1 / 120);
    }
    const k = sim.getKinematics();

    expect(Number.isFinite(k.total)).toBe(true);
    expect(k.rodErr).toBeLessThan(0.09);
    expect(Math.abs(k.cartX)).toBeLessThanOrEqual(2.2);
  });
});
