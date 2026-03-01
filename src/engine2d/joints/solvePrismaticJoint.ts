import { BodyState } from '../collision/types';
import { PrismaticJoint } from './types';

export function solvePrismaticVelocity(
  joint: PrismaticJoint,
  bodyA: BodyState,
  bodyB: BodyState,
  dt = 1 / 60
) {
  const cosA = Math.cos(bodyA.angle), sinA = Math.sin(bodyA.angle);
  const cosB = Math.cos(bodyB.angle), sinB = Math.sin(bodyB.angle);

  const raX = joint.localAnchorA.x * cosA - joint.localAnchorA.y * sinA;
  const raY = joint.localAnchorA.x * sinA + joint.localAnchorA.y * cosA;
  const rbX = joint.localAnchorB.x * cosB - joint.localAnchorB.y * sinB;
  const rbY = joint.localAnchorB.x * sinB + joint.localAnchorB.y * cosB;

  const axisX = joint.localAxisA.x * cosA - joint.localAxisA.y * sinA;
  const axisY = joint.localAxisA.x * sinA + joint.localAxisA.y * cosA;
  const perpX = -axisY, perpY = axisX;

  const imA = bodyA.invMass, imB = bodyB.invMass;
  const iiA = bodyA.invInertia, iiB = bodyB.invInertia;

  // 1. Angular constraint (omegaB - omegaA = 0)
  const invAngularMass = iiA + iiB;
  if (invAngularMass > 1e-12) {
    const relOmega = bodyB.omega - bodyA.omega;
    const lambda = -relOmega / invAngularMass;
    bodyA.omega -= iiA * lambda;
    bodyB.omega += iiB * lambda;
  }

  // Helper to get relative velocity at anchors
  const getRelVel = () => {
    const vax = bodyA.vx + (-bodyA.omega * raY);
    const vay = bodyA.vy + (bodyA.omega * raX);
    const vbx = bodyB.vx + (-bodyB.omega * rbY);
    const vby = bodyB.vy + (bodyB.omega * rbX);
    return { x: vbx - vax, y: vby - vay };
  };

  // 2. Linear constraint (perpendicular to axis)
  {
    const crossA = raX * perpY - raY * perpX;
    const crossB = rbX * perpY - rbY * perpX;
    const K = imA + imB + crossA * crossA * iiA + crossB * crossB * iiB;

    if (K > 1e-12) {
      const relV = getRelVel();
      const vn = relV.x * perpX + relV.y * perpY;
      const lambda = -vn / K;
      const ix = lambda * perpX, iy = lambda * perpY;

      bodyA.vx -= ix * imA;
      bodyA.vy -= iy * imA;
      bodyA.omega -= crossA * lambda * iiA;

      bodyB.vx += ix * imB;
      bodyB.vy += iy * imB;
      bodyB.omega += crossB * lambda * iiB;
    }
  }

  // 3. Motor / Limit (along axis)
  {
    const crossA = raX * axisY - raY * axisX;
    const crossB = rbX * axisY - rbY * axisX;
    const K = imA + imB + crossA * crossA * iiA + crossB * crossB * iiB;

    if (K > 1e-12) {
      // Motor
      if (joint.motorEnabled) {
        const relV = getRelVel();
        const speed = relV.x * axisX + relV.y * axisY;
        const target = joint.motorSpeed ?? 0;
        let lambda = -(speed - target) / K;
        const maxForce = Math.max(0, joint.maxMotorForce ?? 0);
        if (maxForce > 0) {
          const maxImpulse = maxForce * dt;
          lambda = Math.max(-maxImpulse, Math.min(maxImpulse, lambda));
        }
        const ix = lambda * axisX, iy = lambda * axisY;
        bodyA.vx -= ix * imA;
        bodyA.vy -= iy * imA;
        bodyA.omega -= crossA * lambda * iiA;
        bodyB.vx += ix * imB;
        bodyB.vy += iy * imB;
        bodyB.omega += crossB * lambda * iiB;
      }

      // Limit
      if (joint.limitEnabled) {
        const relV = getRelVel();
        const speed = relV.x * axisX + relV.y * axisY;
        const dX = (bodyB.x + rbX) - (bodyA.x + raX);
        const dY = (bodyB.y + rbY) - (bodyA.y + raY);
        const translation = dX * axisX + dY * axisY;

        const lower = joint.lowerTranslation ?? -Infinity;
        const upper = joint.upperTranslation ?? Infinity;

        let lambda = 0;
        if (translation <= lower && speed < 0) {
          lambda = -speed / K;
        } else if (translation >= upper && speed > 0) {
          lambda = -speed / K;
        }

        if (lambda !== 0) {
          const ix = lambda * axisX, iy = lambda * axisY;
          bodyA.vx -= ix * imA;
          bodyA.vy -= iy * imA;
          bodyA.omega -= crossA * lambda * iiA;
          bodyB.vx += ix * imB;
          bodyB.vy += iy * imB;
          bodyB.omega += crossB * lambda * iiB;
        }
      }
    }
  }
}

export function solvePrismaticPosition(joint: PrismaticJoint, bodyA: BodyState, bodyB: BodyState, beta = 0.2) {
  let maxError = 0;

  const imA = bodyA.invMass, imB = bodyB.invMass;
  const iiA = bodyA.invInertia, iiB = bodyB.invInertia;

  // 1. Angular
  {
    const ref = joint.referenceAngle ?? 0;
    const C = bodyB.angle - bodyA.angle - ref;
    const invAngularMass = iiA + iiB;
    if (invAngularMass > 1e-12) {
      const lambda = -beta * C / invAngularMass;
      bodyA.angle -= iiA * lambda;
      bodyB.angle += iiB * lambda;
      maxError = Math.max(maxError, Math.abs(C));
    }
  }

  // Re-calculate for dynamic anchors
  const cosA = Math.cos(bodyA.angle), sinA = Math.sin(bodyA.angle);
  const cosB = Math.cos(bodyB.angle), sinB = Math.sin(bodyB.angle);
  const raX = joint.localAnchorA.x * cosA - joint.localAnchorA.y * sinA;
  const raY = joint.localAnchorA.x * sinA + joint.localAnchorA.y * cosA;
  const rbX = joint.localAnchorB.x * cosB - joint.localAnchorB.y * sinB;
  const rbY = joint.localAnchorB.x * sinB + joint.localAnchorB.y * cosB;

  const axisX = joint.localAxisA.x * cosA - joint.localAxisA.y * sinA;
  const axisY = joint.localAxisA.x * sinA + joint.localAxisA.y * cosA;
  const perpX = -axisY, perpY = axisX;

  // 2. Linear Perp
  {
    const dX = (bodyB.x + rbX) - (bodyA.x + raX);
    const dY = (bodyB.y + rbY) - (bodyA.y + raY);
    const C = dX * perpX + dY * perpY;

    const crossA = raX * perpY - raY * perpX;
    const crossB = rbX * perpY - rbY * perpX;
    const K = imA + imB + crossA * crossA * iiA + crossB * crossB * iiB;

    if (K > 1e-12) {
      const lambda = -beta * C / K;
      const px = lambda * perpX, py = lambda * perpY;
      bodyA.x -= px * imA;
      bodyA.y -= py * imA;
      bodyA.angle -= crossA * lambda * iiA;
      bodyB.x += px * imB;
      bodyB.y += py * imB;
      bodyB.angle += crossB * lambda * iiB;
      maxError = Math.max(maxError, Math.abs(C));
    }
  }

  // 3. Limit
  if (joint.limitEnabled) {
    const dX = (bodyB.x + rbX) - (bodyA.x + raX);
    const dY = (bodyB.y + rbY) - (bodyA.y + raY);
    const translation = dX * axisX + dY * axisY;

    const lower = joint.lowerTranslation ?? -Infinity;
    const upper = joint.upperTranslation ?? Infinity;

    let C = 0;
    if (translation < lower) C = translation - lower;
    else if (translation > upper) C = translation - upper;

    if (C !== 0) {
      const crossA = raX * axisY - raY * axisX;
      const crossB = rbX * axisY - rbY * axisX;
      const K = imA + imB + crossA * crossA * iiA + crossB * crossB * iiB;

      if (K > 1e-12) {
        const lambda = -beta * C / K;
        const px = lambda * axisX, py = lambda * axisY;
        bodyA.x -= px * imA;
        bodyA.y -= py * imA;
        bodyA.angle -= crossA * lambda * iiA;
        bodyB.x += px * imB;
        bodyB.y += py * imB;
        bodyB.angle += crossB * lambda * iiB;
        maxError = Math.max(maxError, Math.abs(C));
      }
    }
  }

  return maxError;
}
