import { BodyState } from './types';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type BroadPhaseMode = 'uniform-grid' | 'spatial-hash';

export interface BroadPhaseOptions {
  mode?: BroadPhaseMode;
  cellSize?: number;
}

export function getBodyAABB(body: BodyState, dt = 0): BoundingBox {
  let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;

  if ((body.shape === 'polygon' || body.shape === 'polyline') && body.worldVertices && body.worldVertices.length > 0) {
    for (const v of body.worldVertices) {
      if (v.x < x1) x1 = v.x; if (v.x > x2) x2 = v.x;
      if (v.y < y1) y1 = v.y; if (v.y > y2) y2 = v.y;
    }
  } else if (body.shape === 'circle') {
    const r = body.radius || 0;
    x1 = body.x - r; x2 = body.x + r;
    y1 = body.y - r; y2 = body.y + r;
  } else {
    const hw = body.halfW || 0;
    const hh = body.halfH || 0;
    x1 = body.x - hw; x2 = body.x + hw;
    y1 = body.y - hh; y2 = body.y + hh;
  }

  if (dt <= 0) {
    return { minX: x1, maxX: x2, minY: y1, maxY: y2 };
  }

  // Swept AABB
  const nextX1 = x1 + body.vx * dt;
  const nextX2 = x2 + body.vx * dt;
  const nextY1 = y1 + body.vy * dt;
  const nextY2 = y2 + body.vy * dt;

  return {
    minX: Math.min(x1, nextX1),
    maxX: Math.max(x2, nextX2),
    minY: Math.min(y1, nextY1),
    maxY: Math.max(y2, nextY2)
  };
}

export function computeCandidates(bodies: BodyState[], dt = 0, options: BroadPhaseOptions = {}): [BodyState, BodyState][] {
  const { mode = 'spatial-hash', cellSize: manualCellSize } = options;
  
  // Auto-tune cell size if not provided
  let cellSize = manualCellSize;
  if (!cellSize) {
    let sumS = 0;
    for (const b of bodies) {
      if (b.shape === 'circle') sumS += b.radius;
      else if (b.shape === 'aabb') sumS += Math.max(b.halfW || 0, b.halfH || 0);
      else if (b.shape === 'polygon' && b.localVertices) {
        let maxD2 = 0;
        for (const v of b.localVertices) maxD2 = Math.max(maxD2, v.x*v.x + v.y*v.y);
        sumS += Math.sqrt(maxD2);
      }
    }
    const avgS = bodies.length > 0 ? sumS / bodies.length : 20;
    cellSize = avgS * 2.5; // Heuristic: 2.5 * average size
    if (cellSize < 10) cellSize = 10;
  }

  if (mode === 'uniform-grid') {
    return computeUniformGrid(bodies, dt, cellSize);
  } else {
    return computeSpatialHash(bodies, dt, cellSize);
  }
}

function computeUniformGrid(bodies: BodyState[], dt: number, cellSize: number): [BodyState, BodyState][] {
  const grid = new Map<string, BodyState[]>();
  
  for (const body of bodies) {
    const aabb = getBodyAABB(body, dt);
    const minIx = Math.floor(aabb.minX / cellSize);
    const maxIx = Math.floor(aabb.maxX / cellSize);
    const minIy = Math.floor(aabb.minY / cellSize);
    const maxIy = Math.floor(aabb.maxY / cellSize);
    
    for (let ix = minIx; ix <= maxIx; ix++) {
      for (let iy = minIy; iy <= maxIy; iy++) {
        const key = `${ix},${iy}`;
        let cell = grid.get(key);
        if (!cell) { cell = []; grid.set(key, cell); }
        cell.push(body);
      }
    }
  }
  
  return collectPairsFromGrid(grid, dt);
}

function computeSpatialHash(bodies: BodyState[], dt: number, cellSize: number): [BodyState, BodyState][] {
  const hash = new Map<number, BodyState[]>();
  
  const getHashKey = (ix: number, iy: number) => {
    // 73856093, 19349663, 83492791 are arbitrary large primes
    return (ix * 73856093) ^ (iy * 19349663);
  };

  for (const body of bodies) {
    const aabb = getBodyAABB(body, dt);
    const minIx = Math.floor(aabb.minX / cellSize);
    const maxIx = Math.floor(aabb.maxX / cellSize);
    const minIy = Math.floor(aabb.minY / cellSize);
    const maxIy = Math.floor(aabb.maxY / cellSize);
    
    for (let ix = minIx; ix <= maxIx; ix++) {
      for (let iy = minIy; iy <= maxIy; iy++) {
        const key = getHashKey(ix, iy);
        let bucket = hash.get(key);
        if (!bucket) { bucket = []; hash.set(key, bucket); }
        bucket.push(body);
      }
    }
  }
  
  const pairs = collectPairsFromGrid(hash as any, dt);
  return pairs;
}

function collectPairsFromGrid(grid: Map<any, BodyState[]>, dt: number): [BodyState, BodyState][] {
  const pairs = new Map<string, [BodyState, BodyState]>();
  
  for (const cellBodies of grid.values()) {
    if (cellBodies.length < 2) continue;
    
    for (let i = 0; i < cellBodies.length; i++) {
      for (let j = i + 1; j < cellBodies.length; j++) {
        const a = cellBodies[i];
        const b = cellBodies[j];
        
        const pairId = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        if (!pairs.has(pairId)) {
          const aABB = getBodyAABB(a, dt);
          const bABB = getBodyAABB(b, dt);
          
          if (aABB.minX <= bABB.maxX && aABB.maxX >= bABB.minX &&
              aABB.minY <= bABB.maxY && aABB.maxY >= bABB.minY) {
            pairs.set(pairId, a.id < b.id ? [a, b] : [b, a]);
          }
        }
      }
    }
  }
  
  return Array.from(pairs.values());
}
