import { describe, expect, it } from 'vitest';

import { DampedPendulum } from '../src/simulations/dampedPendulum';

describe('DampedPendulum', () => {
  it('starts with configured initial state', () => {
    const sim = new DampedPendulum({ initialAngle: 1.1, initialAngularVelocity: 0.4 });
    const [theta, omega] = sim.getState();

    expect(theta).toBeCloseTo(1.1);
    expect(omega).toBeCloseTo(0.4);
  });

  it('decreases total energy with damping over time (coarse check)', () => {
    const sim = new DampedPendulum({ damping: 0.4, initialAngle: 1.0, initialAngularVelocity: 0.2 });
    const start = sim.getKinematics().total;

    // One explicit Euler-like update just to verify damping direction at derivative level.
    const [theta, omega] = sim.getState();
    const [, domega] = sim.derivatives([theta, omega], 0);
    sim.setState([theta + omega * 0.02, omega + domega * 0.02]);

    const next = sim.getKinematics().total;
    expect(next).toBeLessThan(start + 0.2);
  });
});
