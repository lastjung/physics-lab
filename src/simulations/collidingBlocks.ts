import type { SimulationModel, StateVector } from '../core/types';

export interface CollidingBlocksParams {
  gravity: number;
  damping: number;
  restitution: number;
  wallRestitution: number;
  blockSize: number;
  rows: number;
  cols: number;
  spacing: number;
  initialKick: number;
}

const defaults: CollidingBlocksParams = {
  gravity: 9.81,
  damping: 0.02,
  restitution: 0.6,
  wallRestitution: 0.35,
  blockSize: 0.18,
  rows: 3,
  cols: 4,
  spacing: 0.03,
  initialKick: 1.4,
};

export interface BlockKinematics {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  half: number;
}

export class CollidingBlocks implements SimulationModel {
  private state: StateVector = [];
  private time = 0;
  private params: CollidingBlocksParams;

  constructor(params: Partial<CollidingBlocksParams> = {}) {
    this.params = { ...defaults, ...params };
    this.reset();
  }

  static getDefaultParams(): CollidingBlocksParams {
    return { ...defaults };
  }

  getState(): StateVector {
    return [...this.state];
  }

  setState(next: StateVector): void {
    this.state = [...next];
  }

  derivatives(state: StateVector): StateVector {
    const d = this.params.damping;
    const g = this.params.gravity;
    const out: number[] = [];
    for (let i = 0; i < state.length; i += 4) {
      const vx = state[i + 2];
      const vy = state[i + 3];
      out.push(vx, vy, -d * vx, -g - d * vy);
    }
    return out;
  }

  reset(): void {
    this.time = 0;
    this.state = [];
    const { rows, cols, blockSize, spacing } = this.params;
    const half = blockSize * 0.5;
    const width = cols * blockSize + (cols - 1) * spacing;
    const startX = -width * 0.5 + half;
    const startY = 0.7;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = startX + c * (blockSize + spacing);
        const y = startY + r * (blockSize + spacing);
        this.state.push(x, y, 0, 0);
      }
    }

    this.kick(this.params.initialKick);
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof CollidingBlocksParams>(key: K, value: CollidingBlocksParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): CollidingBlocksParams {
    return { ...this.params };
  }

  kick(strength = 1.0): void {
    for (let i = 0; i < this.state.length; i += 4) {
      const angle = Math.random() * Math.PI * 2;
      const mag = strength * (0.2 + Math.random() * 0.8);
      this.state[i + 2] += Math.cos(angle) * mag;
      this.state[i + 3] += Math.sin(angle) * mag;
    }
  }

  setBlockState(index: number, x: number, y: number, vx: number, vy: number): void {
    const o = index * 4;
    if (o + 3 >= this.state.length) return;
    this.state[o] = x;
    this.state[o + 1] = y;
    this.state[o + 2] = vx;
    this.state[o + 3] = vy;
  }

  getBlocks(): BlockKinematics[] {
    const half = this.params.blockSize * 0.5;
    const blocks: BlockKinematics[] = [];
    for (let i = 0, id = 0; i < this.state.length; i += 4, id += 1) {
      blocks.push({
        id,
        x: this.state[i],
        y: this.state[i + 1],
        vx: this.state[i + 2],
        vy: this.state[i + 3],
        half,
      });
    }
    return blocks;
  }

  resolveCollisions(minX: number, maxX: number, minY: number, maxY: number): number {
    const half = this.params.blockSize * 0.5;
    const eWall = this.params.wallRestitution;
    const e = this.params.restitution;
    let impact = 0;

    for (let i = 0; i < this.state.length; i += 4) {
      let x = this.state[i];
      let y = this.state[i + 1];
      let vx = this.state[i + 2];
      let vy = this.state[i + 3];

      if (x - half < minX) {
        x = minX + half;
        impact = Math.max(impact, Math.abs(vx));
        vx = Math.abs(vx) * eWall;
      } else if (x + half > maxX) {
        x = maxX - half;
        impact = Math.max(impact, Math.abs(vx));
        vx = -Math.abs(vx) * eWall;
      }

      if (y - half < minY) {
        y = minY + half;
        impact = Math.max(impact, Math.abs(vy));
        vy = Math.abs(vy) * eWall;
      } else if (y + half > maxY) {
        y = maxY - half;
        impact = Math.max(impact, Math.abs(vy));
        vy = -Math.abs(vy) * eWall;
      }

      this.state[i] = x;
      this.state[i + 1] = y;
      this.state[i + 2] = vx;
      this.state[i + 3] = vy;
    }

    for (let i = 0; i < this.state.length; i += 4) {
      for (let j = i + 4; j < this.state.length; j += 4) {
        const dx = this.state[j] - this.state[i];
        const dy = this.state[j + 1] - this.state[i + 1];
        const overlapX = this.params.blockSize - Math.abs(dx);
        const overlapY = this.params.blockSize - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const nx = dx >= 0 ? 1 : -1;
          const correction = overlapX * 0.5;
          this.state[i] -= nx * correction;
          this.state[j] += nx * correction;

          const rv = this.state[j + 2] - this.state[i + 2];
          const relN = rv * nx;
          if (relN < 0) {
            const impulse = -(1 + e) * relN * 0.5;
            this.state[i + 2] -= impulse * nx;
            this.state[j + 2] += impulse * nx;
            impact = Math.max(impact, Math.abs(relN));
          }
        } else {
          const ny = dy >= 0 ? 1 : -1;
          const correction = overlapY * 0.5;
          this.state[i + 1] -= ny * correction;
          this.state[j + 1] += ny * correction;

          const rv = this.state[j + 3] - this.state[i + 3];
          const relN = rv * ny;
          if (relN < 0) {
            const impulse = -(1 + e) * relN * 0.5;
            this.state[i + 3] -= impulse * ny;
            this.state[j + 3] += impulse * ny;
            impact = Math.max(impact, Math.abs(relN));
          }
        }
      }
    }

    return impact;
  }

  getKinematics() {
    let kinetic = 0;
    let maxSpeed = 0;
    for (let i = 0; i < this.state.length; i += 4) {
      const vx = this.state[i + 2];
      const vy = this.state[i + 3];
      const s = Math.hypot(vx, vy);
      kinetic += 0.5 * s * s;
      maxSpeed = Math.max(maxSpeed, s);
    }
    return {
      count: this.state.length / 4,
      kinetic,
      maxSpeed,
    };
  }
}
