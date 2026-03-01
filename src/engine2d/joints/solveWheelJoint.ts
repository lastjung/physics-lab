import { BodyState } from '../collision/types';
import { WheelJoint } from './types';

export function solveWheelVelocity(
  joint: WheelJoint,
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

  // Helper to get relative velocity at anchors
  const getRelVel = () => {
    const vax = bodyA.vx + (-bodyA.omega * raY);
    const vay = bodyA.vy + (bodyA.omega * raX);
    const vbx = bodyB.vx + (-bodyB.omega * rbY);
    const vby = bodyB.vy + (bodyB.omega * rbX);
    return { x: vbx - vax, y: vby - vay };
  };

  // 1. Perpendicular linear constraint (Hard)
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

  // 2. Suspension Spring/Damper (Along Axis) - Soft Constraint approach
  if (joint.stiffness && joint.stiffness > 0) {
    const crossA = raX * axisY - raY * axisX;
    const crossB = rbX * axisY - rbY * axisX;
    const K = imA + imB + crossA * crossA * iiA + crossB * crossB * iiB;

    if (K > 1e-12) {
      const dX = (bodyB.x + rbX) - (bodyA.x + raX);
      const dY = (bodyB.y + rbY) - (bodyA.y + raY);
      const translation = dX * axisX + dY * axisY;

      const relV = getRelVel();
      const speed = relV.x * axisX + relV.y * axisY;

      // Force = -stiffness * translation - damping * speed
      const stiffness = joint.stiffness;
      const damping = joint.damping ?? 0;
      
      const impulse = (-stiffness * translation - damping * speed) * dt;
      
      const ix = impulse * axisX, iy = impulse * axisY;
      bodyA.vx -= ix * imA;
      bodyA.vy -= iy * imA;
      bodyA.omega -= crossA * impulse * iiA;

      bodyB.vx += ix * imB;
      bodyB.vy += iy * imB;
      bodyB.omega += crossB * impulse * iiB;
    }
  }

  // 3. Angular Motor
  if (joint.motorEnabled) {
    const invAngularMass = iiA + iiB;
    if (invAngularMass > 1e-12) {
      const target = joint.motorSpeed ?? 0;
      const relOmega = bodyB.omega - bodyA.omega;
      let lambda = -(relOmega - target) / invAngularMass;

      const maxMotorTorque = Math.max(0, joint.maxMotorTorque ?? 0);
      if (maxMotorTorque > 0) {
        const maxMotorImpulse = maxMotorTorque * dt;
        lambda = Math.max(-maxMotorImpulse, Math.min(maxMotorImpulse, lambda));
      }

      bodyA.omega -= iiA * lambda;
      bodyB.omega += iiB * lambda;
    }
  }
}

export function solveWheelPosition(joint: WheelJoint, bodyA: BodyState, bodyB: BodyState, beta = 0.2) {
  let maxError = 0;

  const imA = bodyA.invMass, imB = bodyB.invMass;
  const iiA = bodyA.invInertia, iiB = bodyB.invInertia;

  const cosA = Math.cos(bodyA.angle), sinA = Math.sin(bodyA.angle);
  const cosB = Math.cos(bodyB.angle), sinB = Math.sin(bodyB.angle);
  
  const raX = joint.localAnchorA.x * cosA - joint.localAnchorA.y * sinA;
  const raY = joint.localAnchorA.x * sinA + joint.localAnchorA.y * cosA;
  const rbX = joint.localAnchorB.x * cosB - joint.localAnchorB.y * sinB;
  const rbY = joint.localAnchorB.x * sinB + joint.localAnchorB.y * cosB;

  const axisX = joint.localAxisA.x * cosA - joint.localAxisA.y * sinA;
  const axisY = joint.localAxisA.x * sinA + joint.localAxisA.y * cosA;
  const perpX = -axisY, perpY = axisX;

  // Linear Perp
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

  return maxError;
}
