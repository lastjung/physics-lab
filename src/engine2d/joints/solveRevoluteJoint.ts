import { BodyState } from '../collision/types';
import { RevoluteJoint } from './types';

export function solveRevoluteVelocity(
  joint: RevoluteJoint,
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

  const vax = bodyA.vx + (-bodyA.omega * raY);
  const vay = bodyA.vy + (bodyA.omega * raX);
  const vbx = bodyB.vx + (-bodyB.omega * rbY);
  const vby = bodyB.vy + (bodyB.omega * rbX);

  const relVx = vbx - vax;
  const relVy = vby - vay;

  const imA = bodyA.invMass, imB = bodyB.invMass;
  const iiA = bodyA.invInertia, iiB = bodyB.invInertia;

  const k11 = imA + imB + raY * raY * iiA + rbY * rbY * iiB;
  const k12 = -raX * raY * iiA - rbX * rbY * iiB;
  const k22 = imA + imB + raX * raX * iiA + rbX * rbX * iiB;

  const det = k11 * k22 - k12 * k12;
  if (Math.abs(det) > 1e-12) {
    const ix = -(k22 * relVx - k12 * relVy) / det;
    const iy = -(-k12 * relVx + k11 * relVy) / det;

    bodyA.vx -= ix * imA;
    bodyA.vy -= iy * imA;
    bodyA.omega -= (raX * iy - raY * ix) * iiA;

    bodyB.vx += ix * imB;
    bodyB.vy += iy * imB;
    bodyB.omega += (rbX * iy - rbY * ix) * iiB;
  }

  const invAngularMass = iiA + iiB;
  if (invAngularMass <= 1e-12) return;

  // Motor constraint: (omegaB - omegaA) ~= motorSpeed
  if (joint.motorEnabled) {
    const target = joint.motorSpeed ?? 0;
    const relOmega = bodyB.omega - bodyA.omega;
    let lambda = -(relOmega - target) / invAngularMass;

    const maxMotorTorque = Math.max(0, joint.maxMotorTorque ?? 0);
    if (maxMotorTorque > 0 && lambda !== 0) {
      const maxMotorImpulse = maxMotorTorque * dt;
      lambda = Math.max(-maxMotorImpulse, Math.min(maxMotorImpulse, lambda));
    }

    bodyA.omega -= iiA * lambda;
    bodyB.omega += iiB * lambda;
  }

  // Limit velocity correction when the joint is already at/over limit.
  if (joint.limitEnabled) {
    const ref = joint.referenceAngle ?? 0;
    const lower = joint.lowerAngle ?? -Infinity;
    const upper = joint.upperAngle ?? Infinity;
    const relAngle = (bodyB.angle - bodyA.angle) - ref;
    const relOmega = bodyB.omega - bodyA.omega;

    let lambda = 0;
    if (lower === upper) {
      lambda = -relOmega / invAngularMass;
    } else if (relAngle <= lower && relOmega < 0) {
      lambda = -relOmega / invAngularMass;
    } else if (relAngle >= upper && relOmega > 0) {
      lambda = -relOmega / invAngularMass;
    }

    if (lambda !== 0) {
      bodyA.omega -= iiA * lambda;
      bodyB.omega += iiB * lambda;
    }
  }
}

export function solveRevolutePosition(joint: RevoluteJoint, bodyA: BodyState, bodyB: BodyState, beta = 0.2) {
  const cosA = Math.cos(bodyA.angle), sinA = Math.sin(bodyA.angle);
  const cosB = Math.cos(bodyB.angle), sinB = Math.sin(bodyB.angle);

  const raX = joint.localAnchorA.x * cosA - joint.localAnchorA.y * sinA;
  const raY = joint.localAnchorA.x * sinA + joint.localAnchorA.y * cosA;
  const rbX = joint.localAnchorB.x * cosB - joint.localAnchorB.y * sinB;
  const rbY = joint.localAnchorB.x * sinB + joint.localAnchorB.y * cosB;

  const waX = bodyA.x + raX;
  const waY = bodyA.y + raY;
  const wbX = bodyB.x + rbX;
  const wbY = bodyB.y + rbY;

  const Cx = wbX - waX;
  const Cy = wbY - waY;

  const imA = bodyA.invMass, imB = bodyB.invMass;
  const iiA = bodyA.invInertia, iiB = bodyB.invInertia;

  const k11 = imA + imB + raY * raY * iiA + rbY * rbY * iiB;
  const k12 = -raX * raY * iiA - rbX * rbY * iiB;
  const k22 = imA + imB + raX * raX * iiA + rbX * rbX * iiB;

  const det = k11 * k22 - k12 * k12;
  if (Math.abs(det) > 1e-12) {
    // p = K^-1 * (-C * beta)
    const px = -(k22 * Cx - k12 * Cy) / det * beta;
    const py = -(-k12 * Cx + k11 * Cy) / det * beta;

    bodyA.x -= px * imA;
    bodyA.y -= py * imA;
    bodyA.angle -= (raX * py - raY * px) * iiA;

    bodyB.x += px * imB;
    bodyB.y += py * imB;
    bodyB.angle += (rbX * py - rbY * px) * iiB;
  }
  let limitError = 0;
  if (joint.limitEnabled) {
    const invAngularMass = iiA + iiB;
    if (invAngularMass > 1e-12) {
      const ref = joint.referenceAngle ?? 0;
      const lower = joint.lowerAngle ?? -Infinity;
      const upper = joint.upperAngle ?? Infinity;
      const relAngle = (bodyB.angle - bodyA.angle) - ref;

      let C = 0;
      if (lower === upper) C = relAngle - lower;
      else if (relAngle < lower) C = relAngle - lower;
      else if (relAngle > upper) C = relAngle - upper;

      if (C !== 0) {
        const lambda = (-beta * C) / invAngularMass;
        bodyA.angle -= iiA * lambda;
        bodyB.angle += iiB * lambda;
        limitError = Math.abs(C);
      }
    }
  }
  return Math.hypot(Cx, Cy) + limitError;
}
