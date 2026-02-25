import type { StateVector } from './types';

const add = (a: StateVector, b: StateVector, scale = 1): StateVector =>
  a.map((value, index) => value + b[index] * scale);

export const rk4Step = (
  state: StateVector,
  time: number,
  dt: number,
  derivatives: (s: StateVector, t: number) => StateVector,
): StateVector => {
  const k1 = derivatives(state, time);
  const k2 = derivatives(add(state, k1, dt / 2), time + dt / 2);
  const k3 = derivatives(add(state, k2, dt / 2), time + dt / 2);
  const k4 = derivatives(add(state, k3, dt), time + dt);

  return state.map((value, index) => {
    const slope = (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]) / 6;
    return value + slope * dt;
  });
};
