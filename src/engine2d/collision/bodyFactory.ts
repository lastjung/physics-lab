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
  const mass = isStatic ? 0 : width * height;
  const invMass = isStatic ? 0 : 1 / mass;
  
  // Inertia for a box: (1/12) * m * (w^2 + h^2)
  // Inertia for a circle: (1/2) * m * r^2
  let inertia = 0;
  if (!isStatic) {
      if (radius > 0) {
          inertia = 0.5 * mass * radius * radius;
      } else {
          inertia = (1/12) * mass * (width * width + height * height);
      }
  }
  const invInertia = isStatic ? 0 : 1 / inertia;

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
