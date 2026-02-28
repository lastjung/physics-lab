export interface BodyState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  invMass: number;
  restitution: number;
  radius: number;
  friction: number;
  shape: 'circle' | 'aabb';
  halfW?: number;
  halfH?: number;
}

export interface Contact {
  id: string; // "aId:bId" sorted
  aId: string;
  bId: string;
  nx: number;
  ny: number;
  penetration: number;
  relNormalVel: number;
  cachedNormalImpulse?: number;
  cachedTangentImpulse?: number;
}
