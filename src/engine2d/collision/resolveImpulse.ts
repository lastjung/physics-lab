import { BodyState, Contact } from './types';

/**
 * Resolves narrowing impulses for given contact manifolds including rotation.
 * @returns Total normal/tangent impulse magnitude sum.
 */
export function resolveContacts(bodies: Map<string, BodyState>, contacts: Contact[]): number {
  let totalImpulse = 0;
  
  for (const contact of contacts) {
    const a = bodies.get(contact.aId);
    const b = bodies.get(contact.bId);
    if (!a || !b) continue;

    const nx = contact.nx;
    const ny = contact.ny;

    for (const point of contact.points) {
      // Relative distance vectors from centers to contact point
      const ra_x = point.px - a.x;
      const ra_y = point.py - a.y;
      const rb_x = point.px - b.x;
      const rb_y = point.py - b.y;

      // Relative velocity at contact point using v + omega x r
      const va_x = a.vx + (-a.omega * ra_y);
      const va_y = a.vy + (a.omega * ra_x);
      const vb_x = b.vx + (-b.omega * rb_y);
      const vb_y = b.vy + (b.omega * rb_x);

      const rvx = vb_x - va_x;
      const rvy = vb_y - va_y;
      const vn = rvx * nx + rvy * ny;

      // Only resolve if approaching
      if (vn > 0) continue;

      const e = Math.min(a.restitution, b.restitution);
      
      // Effective mass (K-matrix) term for normal impulse
      const raCn = ra_x * ny - ra_y * nx; // cross product ra x n
      const rbCn = rb_x * ny - rb_y * nx; // cross product rb x n
      
      const invMassSum = a.invMass + b.invMass + 
                         (raCn * raCn) * a.invInertia + 
                         (rbCn * rbCn) * b.invInertia;
      
      if (invMassSum > 0) {
        const j = -(1 + e) * vn / invMassSum;
        
        const ix = j * nx;
        const iy = j * ny;

        // Apply linear impulse
        a.vx -= ix * a.invMass;
        a.vy -= iy * a.invMass;
        b.vx += ix * b.invMass;
        b.vy += iy * b.invMass;

        // Apply angular impulse (torque) using cross(r, impulse)
        a.omega -= (ra_x * iy - ra_y * ix) * a.invInertia;
        b.omega += (rb_x * iy - rb_y * ix) * b.invInertia;

        point.cachedNormalImpulse += j;
        totalImpulse += Math.abs(j);
      }

      // --- Friction (Tangent Impulse) ---
      // Re-calculate relative velocity after normal impulse
      const va_x_f = a.vx + (-a.omega * ra_y);
      const va_y_f = a.vy + (a.omega * ra_x);
      const vb_x_f = b.vx + (-b.omega * rb_y);
      const vb_y_f = b.vy + (b.omega * rb_x);
      
      const rvx_f = vb_x_f - va_x_f;
      const rvy_f = vb_y_f - va_y_f;
      const vn_f = rvx_f * nx + rvy_f * ny;
      
      let tx = rvx_f - vn_f * nx;
      let ty = rvy_f - vn_f * ny;
      const tLen = Math.hypot(tx, ty);
      
      if (tLen > 1e-9) {
        tx /= tLen;
        ty /= tLen;
        
        const raCt = ra_x * ty - ra_y * tx;
        const rbCt = rb_x * ty - rb_y * tx;
        
        const invMassSum_t = a.invMass + b.invMass + 
                             (raCt * raCt) * a.invInertia + 
                             (rbCt * rbCt) * b.invInertia;

        if (invMassSum_t > 0) {
          let jt = -(rvx_f * tx + rvy_f * ty) / invMassSum_t;
          const mu = Math.sqrt(a.friction * b.friction);
          const maxJt = mu * Math.abs(point.cachedNormalImpulse);
          
          if (Math.abs(jt) > maxJt) {
            jt = jt > 0 ? maxJt : -maxJt;
          }
          
          const itx = jt * tx;
          const ity = jt * ty;
          
          a.vx -= itx * a.invMass;
          a.vy -= ity * a.invMass;
          b.vx += itx * b.invMass;
          b.vy += ity * b.invMass;
          
          a.omega -= (ra_x * ity - ra_y * itx) * a.invInertia;
          b.omega += (rb_x * ity - rb_y * itx) * b.invInertia;
          
          point.cachedTangentImpulse += jt;
          totalImpulse += Math.abs(jt);
        }
      }
    }
  }
  return totalImpulse;
}
