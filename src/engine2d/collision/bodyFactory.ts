import { BodyState } from './types';

export interface BodyOptions {
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
  radius?: number;
}

export function createBody(
  id: string,
  width: number,
  height: number,
  options: BodyOptions = {}
): BodyState {
  const isStatic = options.isStatic ?? false;
  const radius = options.radius ?? 0;
  
  // Basic mass/inertia calc
  const mass = isStatic ? 0 : (radius > 0 ? Math.PI * radius * radius : width * height);
  const invMass = isStatic ? 0 : (mass > 0 ? 1 / mass : 1);
  
  // Inertia for a box: (1/12) * m * (w^2 + h^2)
  // Inertia for a circle: (1/2) * m * r^2
  let inertia = 0;
  if (!isStatic && mass > 0) {
      if (radius > 0) {
          inertia = 0.5 * mass * radius * radius;
      } else {
          inertia = (1/12) * mass * (width * width + height * height);
      }
  }
  const invInertia = isStatic ? 0 : (inertia > 0 ? 1 / inertia : 1);

  return {
    id,
    x: 0, y: 0,
    vx: 0, vy: 0,
    mass, invMass,
    restitution: options.restitution ?? 0.8,
    friction: options.friction ?? 0.3,
    shape: radius > 0 ? 'circle' : 'aabb',
    radius,
    halfW: width / 2,
    halfH: height / 2,
    angle: 0,
    omega: 0,
    inertia,
    invInertia
  };
}

export function createPolygon(
    id: string,
    vertices: { x: number; y: number }[],
    options: BodyOptions = {}
): BodyState {
    const isStatic = options.isStatic ?? false;
    
    // Simplification for Phase 1: determine bounding box for mass/inertia
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of vertices) {
        if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
    }
    const width = maxX - minX;
    const height = maxY - minY;
    
    const mass = isStatic ? 0 : width * height;
    const invMass = isStatic ? 0 : 1 / mass;
    const inertia = isStatic ? 0 : (1/12) * mass * (width * width + height * height);
    const invInertia = isStatic ? 0 : 1 / inertia;

    return {
        id, x: 0, y: 0, vx: 0, vy: 0, mass, invMass,
        restitution: options.restitution ?? 0.8,
        friction: options.friction ?? 0.3,
        shape: 'polygon',
        radius: 0,
        localVertices: vertices,
        worldVertices: vertices.slice(),
        angle: 0, omega: 0, inertia, invInertia
    };
}

export function createPolyline(
    id: string,
    vertices: { x: number; y: number }[],
    options: BodyOptions = {}
): BodyState {
    // Polylines are typically static environment features
    return {
        id, x: 0, y: 0, vx: 0, vy: 0, mass: 0, invMass: 0,
        restitution: options.restitution ?? 0.8,
        friction: options.friction ?? 0.3,
        shape: 'polyline',
        radius: 0,
        localVertices: vertices,
        worldVertices: vertices.slice(),
        angle: 0, omega: 0, inertia: 0, invInertia: 0
    };
}
