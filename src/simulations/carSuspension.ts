import type { SimulationModel, StateVector } from '../core/types';

export interface CarSuspensionParams {
  sprungMass: number;
  unsprungMass: number;
  springK: number;
  damperC: number;
  tireK: number;
  tireC: number;
  roadAmplitude: number;
  roadFrequency: number;
  gripOffsetX: number;
  gripOffsetY: number;
  initialSprung: number;
  initialUnsprung: number;
  initialSprungV: number;
  initialUnsprungV: number;
}

const defaults: CarSuspensionParams = {
  sprungMass: 1.2,
  unsprungMass: 0.35,
  springK: 22,
  damperC: 1.2,
  tireK: 34,
  tireC: 0.6,
  roadAmplitude: 0.08,
  roadFrequency: 1.4,
  gripOffsetX: 0,
  gripOffsetY: -22,
  initialSprung: 0,
  initialUnsprung: 0,
  initialSprungV: 0,
  initialUnsprungV: 0,
};

export class CarSuspension implements SimulationModel {
  private state: StateVector;
  private time = 0;
  private params: CarSuspensionParams;

  constructor(params: Partial<CarSuspensionParams> = {}) {
    this.params = { ...defaults, ...params };
    this.state = [
      this.params.initialSprung,
      this.params.initialUnsprung,
      this.params.initialSprungV,
      this.params.initialUnsprungV,
    ];
  }

  static getDefaultParams(): CarSuspensionParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector, time: number): StateVector {
    const [zs, zu, vs, vu] = state;
    const p = this.params;
    const zr = p.roadAmplitude * Math.sin(p.roadFrequency * time);
    const vr = p.roadAmplitude * p.roadFrequency * Math.cos(p.roadFrequency * time);

    const fs = -p.springK * (zs - zu) - p.damperC * (vs - vu);
    const ft = -p.tireK * (zu - zr) - p.tireC * (vu - vr);

    const as = fs / p.sprungMass;
    const au = (-fs + ft) / p.unsprungMass;

    return [vs, vu, as, au];
  }

  reset(): void {
    this.state = [this.params.initialSprung, this.params.initialUnsprung, this.params.initialSprungV, this.params.initialUnsprungV];
    this.time = 0;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CarSuspensionParams>(key: K, value: CarSuspensionParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CarSuspensionParams {
    return { ...this.params };
  }

  roadDisplacement(time = this.time): number {
    return this.params.roadAmplitude * Math.sin(this.params.roadFrequency * time);
  }

  getKinematics() {
    const [zs, zu, vs, vu] = this.state;
    const zr = this.roadDisplacement();
    const p = this.params;
    const kinetic = 0.5 * p.sprungMass * vs * vs + 0.5 * p.unsprungMass * vu * vu;
    const potential =
      0.5 * p.springK * (zs - zu) * (zs - zu) + 0.5 * p.tireK * (zu - zr) * (zu - zr);
    return { zs, zu, vs, vu, zr, kinetic, potential, total: kinetic + potential };
  }
}
