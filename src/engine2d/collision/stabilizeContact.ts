import { BodyState, Contact } from './types';

/**
 * Stabilizes position to fix penetration using Baumgarte stabilization including rotation.
 * @returns Total correction distance applied.
 */
export function stabilizeContacts(
  bodies: Map<string, BodyState>, 
  contacts: Contact[], 
  beta = 0.2, 
  slop = 0.01
): number {
  let totalCorrection = 0;
  
  for (const contact of contacts) {
    const a = bodies.get(contact.aId);
    const b = bodies.get(contact.bId);
    if (!a || !b) continue;

    const nx = contact.nx;
    const ny = contact.ny;

    for (const point of contact.points) {
      const penetrationError = Math.max(0, point.penetration - slop);
      
      const ra_x = point.px - a.x;
      const ra_y = point.py - a.y;
      const rb_x = point.px - b.x;
      const rb_y = point.py - b.y;
      
      const raCn = ra_x * ny - ra_y * nx;
      const rbCn = rb_x * ny - rb_y * nx;
      
      const invMassSum = a.invMass + b.invMass + 
                         (raCn * raCn) * a.invInertia + 
                         (rbCn * rbCn) * b.invInertia;
      
      if (invMassSum > 0) {
        const corrMag = (beta * penetrationError) / invMassSum;
        const cx = corrMag * nx;
        const cy = corrMag * ny;

        // Apply linear correction
        a.x -= cx * a.invMass;
        a.y -= cy * a.invMass;
        b.x += cx * b.invMass;
        b.y += cy * b.invMass;

        // Apply angular correction
        a.angle -= (ra_x * cy - ra_y * cx) * a.invInertia;
        b.angle += (rb_x * cy - rb_y * cx) * b.invInertia;

        totalCorrection += Math.hypot(cx, cy);
      }
    }
  }
  return totalCorrection;
}
