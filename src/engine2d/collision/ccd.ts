import { BodyState } from './types';

/**
 * Calculates the earliest time of impact (TOI) between two circles in the range [0, 1].
 * Returns null if no impact occurs within the given dt.
 */
export function timeOfImpactCircleCircle(a: BodyState, b: BodyState, dt: number): number | null {
  const ra = a.radius || 0;
  const rb = b.radius || 0;
  const combinedRadius = ra + rb;

  const px = b.x - a.x;
  const py = b.y - a.y;
  const vx = b.vx - a.vx;
  const vy = b.vy - a.vy;

  const A = vx * vx + vy * vy;
  if (A < 1e-12) return null;

  const B = 2 * (px * vx + py * vy);
  const C = px * px + py * py - combinedRadius * combinedRadius;

  if (C <= 0) return 0;

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return null;

  const t = (-B - Math.sqrt(discriminant)) / (2 * A);
  if (t >= 0 && t <= dt) return t / dt;
  return null;
}

/**
 * Calculates TOI between two AABBs using the Slab method.
 */
export function timeOfImpactAABBAABB(a: BodyState, b: BodyState, dt: number): number | null {
  const haw = a.halfW || 0; const hah = a.halfH || 0;
  const hbw = b.halfW || 0; const hbh = b.halfH || 0;

  // Relative bounding box (Minkowski difference A - B at relative origin)
  // Actually, let's treat it as A moving towards a static B
  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;

  if (Math.abs(dvx) < 1e-12 && Math.abs(dvy) < 1e-12) return null;

  // Relative distance at t=0
  const xInvEntry = (b.x - hbw) - (a.x + haw);
  const xInvExit = (b.x + hbw) - (a.x - haw);
  const yInvEntry = (b.y - hbh) - (a.y + hah);
  const yInvExit = (b.y + hbh) - (a.y - hah);

  // If already overlapping
  if (xInvEntry < 0 && xInvExit > 0 && yInvEntry < 0 && yInvExit > 0) return 0;

  // Use relative velocity to find entry/exit times per axis
  let tXEntry = -Infinity, tXExit = Infinity;
  if (Math.abs(dvx) > 1e-12) {
    tXEntry = xInvEntry / dvx;
    tXExit = xInvExit / dvx;
    if (tXEntry > tXExit) [tXEntry, tXExit] = [tXExit, tXEntry];
  } else if (xInvEntry >= 0 || xInvExit <= 0) {
    return null; // Separated and no relative motion on this axis
  }

  let tYEntry = -Infinity, tYExit = Infinity;
  if (Math.abs(dvy) > 1e-12) {
    tYEntry = yInvEntry / dvy;
    tYExit = yInvExit / dvy;
    if (tYEntry > tYExit) [tYEntry, tYExit] = [tYExit, tYEntry];
  } else if (yInvEntry >= 0 || yInvExit <= 0) {
    return null; 
  }

  const tEntry = Math.max(tXEntry, tYEntry);
  const tExit = Math.min(tXExit, tYExit);

  if (tEntry > tExit || tExit < 0 || tEntry > dt) return null;
  return Math.max(0, tEntry) / dt;
}

/**
 * Calculates TOI between Circle and AABB.
 * Approximation: Treats Circle as an AABB for coarse check, then refines.
 * Or more accurately: Ray vs Rounded AABB.
 */
export function timeOfImpactCircleAABB(c: BodyState, b: BodyState, dt: number): number | null {
  // Simpler approach: Expand the AABB by circle's radius and do point vs AABB CCD
  // This is slightly conservative on corners but correct on faces.
  const r = c.radius || 0;
  const hw = b.halfW || 0;
  const hh = b.halfH || 0;

  const dvx = c.vx - b.vx;
  const dvy = c.vy - b.vy;

  if (Math.abs(dvx) < 1e-12 && Math.abs(dvy) < 1e-12) return null;

  // Minkowski Sum: AABB expanded by radius r
  const minX = b.x - (hw + r);
  const maxX = b.x + (hw + r);
  const minY = b.y - (hh + r);
  const maxY = b.y + (hh + r);

  // If circle center is already inside expanded AABB
  if (c.x > minX && c.x < maxX && c.y > minY && c.y < maxY) return 0;

  // Point c.x, c.y moving towards static expanded box with relative velocity dv
  let tXEntry = -Infinity, tXExit = Infinity;
  if (Math.abs(dvx) > 1e-12) {
    tXEntry = (minX - c.x) / dvx;
    tXExit = (maxX - c.x) / dvx;
    if (tXEntry > tXExit) [tXEntry, tXExit] = [tXExit, tXEntry];
  } else if (c.x <= minX || c.x >= maxX) return null;

  let tYEntry = -Infinity, tYExit = Infinity;
  if (Math.abs(dvy) > 1e-12) {
    tYEntry = (minY - c.y) / dvy;
    tYExit = (maxY - c.y) / dvy;
    if (tYEntry > tYExit) [tYEntry, tYExit] = [tYExit, tYEntry];
  } else if (c.y <= minY || c.y >= maxY) return null;

  const tEntry = Math.max(tXEntry, tYEntry);
  const tExit = Math.min(tXExit, tYExit);

  if (tEntry > tExit || tExit < 0 || tEntry > dt) return null;
  
  // Refinement for corners: if the hit is a corner of the Minkowski AABB, we should check circle-circle
  // For basic CCD, the point-AABB approximation is often sufficient for preventing tunneling.
  return Math.max(0, tEntry) / dt;
}
