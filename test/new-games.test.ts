import { describe, expect, it } from 'vitest';

import { CartPendulum } from '../src/simulations/cartPendulum';
import { NewtonsCradle } from '../src/simulations/newtonsCradle';
import { RollerCoaster } from '../src/simulations/rollerCoaster';
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
});
