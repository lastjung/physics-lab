import { BodyState, Contact } from './types';
import { resolveContacts } from './resolveImpulse';
import { stabilizeContacts } from './stabilizeContact';

// Frame-to-frame impulse cache for Warm Starting
const impulseCache = new Map<string, { jn: number; jt: number }>();

export function clearImpulseCache(): void {
  impulseCache.clear();
}

export function detectContacts(bodies: BodyState[]): Contact[] {
  const contacts: Contact[] = [];
  
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      
      // Handle different shape combinations
      if (a.shape === 'circle' && b.shape === 'circle') {
        processCircleCircle(a, b, contacts);
      } else if (a.shape === 'circle' && b.shape === 'aabb') {
        processCircleAABB(a, b, contacts);
      } else if (a.shape === 'aabb' && b.shape === 'circle') {
        processCircleAABB(b, a, contacts); // Swap normal later if needed, or inside function
      } else if (a.shape === 'aabb' && b.shape === 'aabb') {
        // TODO: Implement AABB-AABB
      }
    }
  }

  return contacts;
}

function processCircleCircle(a: BodyState, b: BodyState, contacts: Contact[]) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist2 = dx * dx + dy * dy;
  const rSum = a.radius + b.radius;
  
  if (dist2 < rSum * rSum) {
    const dist = Math.sqrt(dist2);
    let nx = 1;
    let ny = 0;
    
    if (dist > 1e-9) {
      nx = dx / dist;
      ny = dy / dist;
    }
    
    const penetration = rSum - dist;
    const relNormalVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    
    if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(penetration) && Number.isFinite(relNormalVel)) {
      addContact(a, b, nx, ny, penetration, relNormalVel, contacts);
    }
  }
}

function processCircleAABB(circle: BodyState, aabb: BodyState, contacts: Contact[]) {
  const minX = aabb.x - (aabb.halfW || 0);
  const maxX = aabb.x + (aabb.halfW || 0);
  const minY = aabb.y - (aabb.halfH || 0);
  const maxY = aabb.y + (aabb.halfH || 0);

  // Closest point on AABB to circle center
  const closestX = Math.max(minX, Math.min(circle.x, maxX));
  const closestY = Math.max(minY, Math.min(circle.y, maxY));

  const dx = closestX - circle.x;
  const dy = closestY - circle.y;
  const dist2 = dx * dx + dy * dy;

  const isInside = circle.x >= minX && circle.x <= maxX && circle.y >= minY && circle.y <= maxY;

  if (isInside) {
    // Circle center is inside AABB - find closest edge to push out
    const dLeft = circle.x - minX;
    const dRight = maxX - circle.x;
    const dTop = circle.y - minY;
    const dBottom = maxY - circle.y;
    const minDist = Math.min(dLeft, dRight, dTop, dBottom);

    let nx = 0;
    let ny = 0;
    if (minDist === dLeft) nx = -1;
    else if (minDist === dRight) nx = 1;
    else if (minDist === dTop) ny = -1;
    else ny = 1;

    const penetration = circle.radius + minDist;
    const relNormalVel = (aabb.vx - circle.vx) * nx + (aabb.vy - circle.vy) * ny;
    addContact(circle, aabb, nx, ny, penetration, relNormalVel, contacts);
    return;
  }

  if (dist2 < circle.radius * circle.radius) {
    const dist = Math.sqrt(dist2);
    // Normal points from circle (a) to AABB (b)
    const nx = dist > 1e-9 ? dx / dist : 1;
    const ny = dist > 1e-9 ? dy / dist : 0;
    
    const penetration = circle.radius - dist;
    const relNormalVel = (aabb.vx - circle.vx) * nx + (aabb.vy - circle.vy) * ny;
    addContact(circle, aabb, nx, ny, penetration, relNormalVel, contacts);
  }
}

function addContact(a: BodyState, b: BodyState, nx: number, ny: number, penetration: number, relNormalVel: number, contacts: Contact[]) {
  const sortedIds = [a.id, b.id].sort();
  const contactId = `${sortedIds[0]}:${sortedIds[1]}`;

  contacts.push({
    id: contactId,
    aId: a.id,
    bId: b.id,
    nx,
    ny,
    penetration,
    relNormalVel,
    cachedNormalImpulse: 0,
    cachedTangentImpulse: 0
  });
}

export function stepCollisionPipeline(
  bodies: BodyState[], 
  iterations = 4, 
  warmStart = true
): { contacts: number; impulse: number; correction: number; iterations: number; warmStartedContacts: number } {
  const iterCount = Math.max(1, Math.floor(iterations));
  const bodyMap = new Map(bodies.map(b => [b.id, b]));
  
  const contacts = detectContacts(bodies);
  let warmStartedCount = 0;

  // 1. Warm Starting: Pre-apply cached impulses
  if (warmStart) {
    for (const contact of contacts) {
      const cached = impulseCache.get(contact.id);
      if (cached) {
        const a = bodyMap.get(contact.aId);
        const b = bodyMap.get(contact.bId);
        if (a && b) {
          // Pre-apply Normal Impulse
          const in_x = cached.jn * contact.nx;
          const in_y = cached.jn * contact.ny;
          a.vx -= in_x * a.invMass;
          a.vy -= in_y * a.invMass;
          b.vx += in_x * b.invMass;
          b.vy += in_y * b.invMass;
          contact.cachedNormalImpulse = cached.jn;

          // Pre-apply Tangent Impulse
          // Note: we'd ideally need the original tangent vector from the cache 
          // but re-calculating it from rv-vn*n is common.
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const vn = rvx * contact.nx + rvy * contact.ny;
          let tx = rvx - vn * contact.nx;
          let ty = rvy - vn * contact.ny;
          const tLen = Math.hypot(tx, ty);
          if (tLen > 1e-9) {
            tx /= tLen;
            ty /= tLen;
            const it_x = cached.jt * tx;
            const it_y = cached.jt * ty;
            a.vx -= it_x * a.invMass;
            a.vy -= it_y * a.invMass;
            b.vx += it_x * b.invMass;
            b.vy += it_y * b.invMass;
            contact.cachedTangentImpulse = cached.jt;
          }
          warmStartedCount++;
        }
      }
    }
  }

  let totalImpulse = 0;
  let totalCorrection = 0;

  // 2. Iterative resolution
  for (let i = 0; i < iterCount; i++) {
    totalImpulse += resolveContacts(bodyMap, contacts);
    totalCorrection += stabilizeContacts(bodyMap, contacts);
  }

  // 3. Update Cache & Prue stale entries
  const currentFrameIds = new Set<string>();
  for (const contact of contacts) {
    currentFrameIds.add(contact.id);
    impulseCache.set(contact.id, {
      jn: contact.cachedNormalImpulse || 0,
      jt: contact.cachedTangentImpulse || 0
    });
  }

  for (const cachedId of impulseCache.keys()) {
    if (!currentFrameIds.has(cachedId)) {
      impulseCache.delete(cachedId);
    }
  }

  return {
    contacts: contacts.length,
    impulse: totalImpulse,
    correction: totalCorrection,
    iterations: iterCount,
    warmStartedContacts: warmStartedCount
  };
}
