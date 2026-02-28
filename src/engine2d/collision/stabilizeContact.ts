import { BodyState, Contact } from './types';

/**
 * Stabilizes position to fix penetration (Pseudo-velocities or Baumgarte).
 * @returns Total correction distance applied.
 */
export function stabilizeContacts(bodies: Map<string, BodyState>, contacts: Contact[]): number {
  const beta = 0.2; // Correction strength
  const slop = 0.01; // Allowed penetration
  let totalCorrection = 0;
  
  for (const contact of contacts) {
    const a = bodies.get(contact.aId);
    const b = bodies.get(contact.bId);
    if (!a || !b) continue;

    const penetrationError = Math.max(0, contact.penetration - slop);
    const invMassSum = a.invMass + b.invMass;
    if (invMassSum <= 0) continue;

    const corrMag = (beta * penetrationError) / invMassSum;
    const cx = corrMag * contact.nx;
    const cy = corrMag * contact.ny;

    a.x -= cx * a.invMass;
    a.y -= cy * a.invMass;
    b.x += cx * b.invMass;
    b.y += cy * b.invMass;

    totalCorrection += Math.hypot(cx, cy);
  }
  return totalCorrection;
}
