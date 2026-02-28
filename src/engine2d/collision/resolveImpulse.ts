import { BodyState, Contact } from './types';

/**
 * Resolves narrowing impulses for given contacts.
 * @returns Total normal impulse applied.
 */
export function resolveContacts(bodies: Map<string, BodyState>, contacts: Contact[]): number {
  let totalImpulse = 0;
  
  for (const contact of contacts) {
    const a = bodies.get(contact.aId);
    const b = bodies.get(contact.bId);
    if (!a || !b) continue;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const vn = rvx * contact.nx + rvy * contact.ny;

    if (vn > 0) continue;

    const e = Math.min(a.restitution, b.restitution);
    const invMassSum = a.invMass + b.invMass;
    if (invMassSum <= 0) continue;

    const j = -(1 + e) * vn / invMassSum;
    
    const ix = j * contact.nx;
    const iy = j * contact.ny;

    a.vx -= ix * a.invMass;
    a.vy -= iy * a.invMass;
    b.vx += ix * b.invMass;
    b.vy += iy * b.invMass;

    // Track for caching (Warm Starting)
    contact.cachedNormalImpulse = (contact.cachedNormalImpulse || 0) + j;

    // --- Friction (Tangent Impulse) ---
    const rvx_after = b.vx - a.vx;
    const rvy_after = b.vy - a.vy;
    
    const vnt = rvx_after * contact.nx + rvy_after * contact.ny;
    let tx = rvx_after - vnt * contact.nx;
    let ty = rvy_after - vnt * contact.ny;
    const tLen = Math.hypot(tx, ty);
    
    if (tLen > 1e-9) {
      tx /= tLen;
      ty /= tLen;
      
      let jt = -(rvx_after * tx + rvy_after * ty) / invMassSum;
      const mu = Math.sqrt(a.friction * b.friction);
      
      // Coulomb friction clamp (Simplified for iterative resolution)
      const maxJt = mu * Math.abs(contact.cachedNormalImpulse);
      if (Math.abs(jt) > maxJt) {
        jt = jt > 0 ? maxJt : -maxJt;
      }
      
      const itx = jt * tx;
      const ity = jt * ty;
      
      a.vx -= itx * a.invMass;
      a.vy -= ity * a.invMass;
      b.vx += itx * b.invMass;
      b.vy += ity * b.invMass;
      
      contact.cachedTangentImpulse = (contact.cachedTangentImpulse || 0) + jt;
      totalImpulse += Math.abs(jt);
    }

    totalImpulse += Math.abs(j);
  }
  return totalImpulse;
}
