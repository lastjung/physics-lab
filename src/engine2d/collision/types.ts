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
  shape: 'circle' | 'aabb' | 'polygon' | 'polyline';
  halfW?: number;
  halfH?: number;
  localVertices?: { x: number; y: number }[];
  worldVertices?: { x: number; y: number }[];
  angle: number;
  omega: number;
  inertia: number;
  invInertia: number;
}

export interface ContactPoint {
  px: number;
  py: number;
  penetration: number;
  cachedNormalImpulse: number;
  cachedTangentImpulse: number;
}

export interface Contact {
  id: string; // "aId:bId" sorted
  aId: string;
  bId: string;
  nx: number;
  ny: number;
  points: ContactPoint[];
}
