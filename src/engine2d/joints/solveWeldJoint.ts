import { BodyState } from '../collision/types';
import { WeldJoint } from './types';

export function solveWeldVelocity(joint: WeldJoint, bodyA: BodyState, bodyB: BodyState) {
    // 1. Point-to-point constraint (identical to Revolute)
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

    // 2. Angular constraint (fixing omegaB - omegaA = 0)
    const invAngularMass = iiA + iiB;
    if (invAngularMass > 1e-12) {
        const relOmega = bodyB.omega - bodyA.omega;
        const lambda = -relOmega / invAngularMass;
        bodyA.omega -= iiA * lambda;
        bodyB.omega += iiB * lambda;
    }
}

export function solveWeldPosition(joint: WeldJoint, bodyA: BodyState, bodyB: BodyState, beta = 0.2) {
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
        const px = -(k22 * Cx - k12 * Cy) / det * beta;
        const py = -(-k12 * Cx + k11 * Cy) / det * beta;

        bodyA.x -= px * imA;
        bodyA.y -= py * imA;
        bodyA.angle -= (raX * py - raY * px) * iiA;

        bodyB.x += px * imB;
        bodyB.y += py * imB;
        bodyB.angle += (rbX * py - rbY * px) * iiB;
    }

    // 2. Angular correction
    const invAngularMass = iiA + iiB;
    let angularError = 0;
    if (invAngularMass > 1e-12) {
        const relAngle = (bodyB.angle - bodyA.angle) - joint.referenceAngle;
        const lambda = (-beta * relAngle) / invAngularMass;
        bodyA.angle -= iiA * lambda;
        bodyB.angle += iiB * lambda;
        angularError = Math.abs(relAngle);
    }

    return Math.hypot(Cx, Cy) + angularError;
}
