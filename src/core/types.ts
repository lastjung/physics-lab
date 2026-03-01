export type StateVector = number[];

export interface SimulationModel {
  getState(): StateVector;
  setState(next: StateVector): void;
  derivatives(state: StateVector, time: number): StateVector;
  reset(): void;
  getTime(): number;
  setTime(time: number): void;
  step?(dt: number): void;
}
