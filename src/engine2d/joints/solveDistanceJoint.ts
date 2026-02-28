import { BodyState } from '../collision/types';
import { DistanceJoint } from './types';

export function solveDistanceVelocity(joint: DistanceJoint, bodyA: BodyState, bodyB: BodyState) {
  // World anchors
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

  let dx = wbX - waX;
  let dy = wbY - waY;
  const dist = Math.hypot(dx, dy);
  if (dist > 1e-9) { dx /= dist; dy /= dist; }

  const vax = bodyA.vx + (-bodyA.omega * raY);
  const vay = bodyA.vy + (bodyA.omega * raX);
  const vbx = bodyB.vx + (-bodyB.omega * rbY);
  const vby = bodyB.vy + (bodyB.omega * rbX);

  const relV = (vbx - vax) * dx + (vby - vay) * dy;

  // Mass matrix for the constraint
  const invMassSum = bodyA.invMass + bodyB.invMass;
  const rAn = raX * dy - raY * dx;
  const rBn = rbX * dy - rbY * dx;
  const K = invMassSum + rAn * rAn * bodyA.invInertia + rBn * rBn * bodyB.invInertia;

  if (K > 0) {
    const impulse = -relV / K;
    const ix = impulse * dx;
    const iy = impulse * dy;

    bodyA.vx -= ix * bodyA.invMass;
    bodyA.vy -= iy * bodyA.invMass;
    bodyA.omega -= (raX * iy - raY * ix) * bodyA.invInertia;

    bodyB.vx += ix * bodyB.invMass;
    bodyB.vy += iy * bodyB.invMass;
    bodyB.omega += (rbX * iy - rbY * ix) * bodyB.invInertia;
  }
}

export function solveDistancePosition(joint: DistanceJoint, bodyA: BodyState, bodyB: BodyState, beta = 0.2) {
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

  let dx = wbX - waX;
  let dy = wbY - waY;
  const dist = Math.hypot(dx, dy);
  if (dist > 1e-9) { dx /= dist; dy /= dist; }

  const C = dist - joint.length;
  const correction = -C * beta;

  const invMassSum = bodyA.invMass + bodyB.invMass;
  const rAn = raX * dy - raY * dx;
  const rBn = rbX * dy - rbY * dx;
  const K = invMassSum + rAn * rAn * bodyA.invInertia + rBn * rBn * bodyB.invInertia;

  if (K > 0) {
    const p = correction / K;
    const px = p * dx;
    const py = p * dy;

    bodyA.x -= px * bodyA.invMass;
    bodyA.y -= py * bodyA.invMass;
    bodyA.angle -= (raX * py - raY * px) * bodyA.invInertia;

    bodyB.x += px * bodyB.invMass;
    bodyB.y += py * bodyB.invMass;
    bodyB.angle += (rbX * py - rbY * px) * bodyB.invInertia;
  }
  return Math.abs(C);
}
