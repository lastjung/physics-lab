import { rk4Step } from './integrators';
import type { SimulationModel } from './types';

export class SimulationRunner {
  private readonly fixedDt: number;
  private accumulator = 0;
  private lastTs = 0;
  private running = false;

  constructor(
    private readonly model: SimulationModel,
    private readonly onUpdate: () => void,
    fixedDt = 1 / 120,
  ) {
    this.fixedDt = fixedDt;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  step(steps = 1): void {
    for (let i = 0; i < steps; i += 1) {
      if (this.model.step) {
        this.model.step(this.fixedDt);
      } else {
        const next = rk4Step(
          this.model.getState(),
          this.model.getTime(),
          this.fixedDt,
          this.model.derivatives.bind(this.model),
        );
        this.model.setState(next);
        this.model.setTime(this.model.getTime() + this.fixedDt);
      }
    }
    this.onUpdate();
  }

  reset(): void {
    this.model.reset();
    this.accumulator = 0;
    this.onUpdate();
  }

  private tick = (ts: number): void => {
    if (!this.running) return;

    const delta = Math.min((ts - this.lastTs) / 1000, 0.05);
    this.lastTs = ts;
    this.accumulator += delta;

    while (this.accumulator >= this.fixedDt) {
      this.step(1);
      this.accumulator -= this.fixedDt;
    }

    requestAnimationFrame(this.tick);
  };
}
