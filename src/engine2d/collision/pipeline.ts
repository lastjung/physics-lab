import { BodyState, Contact } from './types';
import { resolveContacts } from './resolveImpulse';
import { stabilizeContacts } from './stabilizeContact';
import { computeCandidates, BroadPhaseOptions, BroadPhaseMode } from './broadPhase';
import { timeOfImpactCircleCircle, timeOfImpactCircleAABB, timeOfImpactAABBAABB, timeOfImpactPolygonPolygon } from './ccd';
import { Joint } from '../joints/types';
import { solveDistanceVelocity, solveDistancePosition } from '../joints/solveDistanceJoint';
import { solveRevoluteVelocity, solveRevolutePosition } from '../joints/solveRevoluteJoint';
import { solvePrismaticVelocity, solvePrismaticPosition } from '../joints/solvePrismaticJoint';
import { solveWeldVelocity, solveWeldPosition } from '../joints/solveWeldJoint';
import { solveWheelVelocity, solveWheelPosition } from '../joints/solveWheelJoint';

// Frame-to-frame impulse cache for Warm Starting
const impulseCache = new Map<string, { jn: number; jt: number }>();

export function clearImpulseCache(): void {
  impulseCache.clear();
}

export function detectContacts(bodies: BodyState[], dt = 0, bpOptions: BroadPhaseOptions = {}, joints: Joint[] = []): Contact[] {
  const contacts: Contact[] = [];
  const candidates = computeCandidates(bodies, dt, bpOptions);
  
  const jointPairs = new Set<string>();
  for (const j of joints) {
    const ids = [j.bodyIdA, j.bodyIdB].sort();
    jointPairs.add(`${ids[0]}_${ids[1]}`);
  }

  for (const [a, b] of candidates) {
    const ids = [a.id, b.id].sort();
    if (jointPairs.has(`${ids[0]}_${ids[1]}`)) continue;

    if (a.shape === 'circle' && b.shape === 'circle') {
      processCircleCircle(a, b, contacts);
    } else if (a.shape === 'circle' && b.shape === 'aabb') {
      processCircleAABB(a, b, contacts);
    } else if (a.shape === 'aabb' && b.shape === 'circle') {
      processCircleAABB(b, a, contacts);
    } else if (a.shape === 'aabb' && b.shape === 'aabb') {
      processAABBAABB(a, b, contacts);
    } else if (a.shape === 'polygon' && b.shape === 'polygon') {
      processPolygonPolygon(a, b, contacts);
    } else if (a.shape === 'circle' && b.shape === 'polygon') {
      processCirclePolygon(a, b, contacts);
    } else if (a.shape === 'polygon' && b.shape === 'circle') {
      processCirclePolygon(b, a, contacts);
    } else if (a.shape === 'polygon' && b.shape === 'aabb') {
      processPolygonAABB(a, b, contacts);
    } else if (a.shape === 'aabb' && b.shape === 'polygon') {
      processPolygonAABB(b, a, contacts);
    } else if (a.shape === 'circle' && b.shape === 'polyline') {
      processCirclePolyline(a, b, contacts);
    } else if (a.shape === 'polyline' && b.shape === 'circle') {
      processCirclePolyline(b, a, contacts);
    } else if (a.shape === 'aabb' && b.shape === 'polyline') {
      processAABBPolyline(a, b, contacts);
    } else if (a.shape === 'polyline' && b.shape === 'aabb') {
      processAABBPolyline(b, a, contacts);
    } else if (a.shape === 'polygon' && b.shape === 'polyline') {
      processPolygonPolyline(a, b, contacts);
    } else if (a.shape === 'polyline' && b.shape === 'polygon') {
      processPolygonPolyline(b, a, contacts);
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
    // Contact point is between the two centers
    const px = a.x + nx * a.radius;
    const py = a.y + ny * a.radius;
    
    addContact(a, b, nx, ny, [{ px, py, penetration, cachedNormalImpulse: 0, cachedTangentImpulse: 0 }], contacts);
  }
}

function processCircleAABB(circle: BodyState, aabb: BodyState, contacts: Contact[]) {
  const minX = aabb.x - (aabb.halfW || 0);
  const maxX = aabb.x + (aabb.halfW || 0);
  const minY = aabb.y - (aabb.halfH || 0);
  const maxY = aabb.y + (aabb.halfH || 0);

  const closestX = Math.max(minX, Math.min(circle.x, maxX));
  const closestY = Math.max(minY, Math.min(circle.y, maxY));

  const dx = closestX - circle.x;
  const dy = closestY - circle.y;
  const dist2 = dx * dx + dy * dy;

  const isInside = circle.x >= minX && circle.x <= maxX && circle.y >= minY && circle.y <= maxY;

  if (isInside) {
    const dLeft = circle.x - minX;
    const dRight = maxX - circle.x;
    const dTop = circle.y - minY;
    const dBottom = maxY - circle.y;
    const minDist = Math.min(dLeft, dRight, dTop, dBottom);

    let nx = 0, ny = 0;
    if (minDist === dLeft) nx = -1;
    else if (minDist === dRight) nx = 1;
    else if (minDist === dTop) ny = -1;
    else ny = 1;

    const penetration = circle.radius + minDist;
    addContact(circle, aabb, nx, ny, [{ px: circle.x, py: circle.y, penetration, cachedNormalImpulse: 0, cachedTangentImpulse: 0 }], contacts);
    return;
  }

  if (dist2 < circle.radius * circle.radius) {
    const dist = Math.sqrt(dist2);
    const nx = dist > 1e-9 ? dx / dist : 1;
    const ny = dist > 1e-9 ? dy / dist : 0;
    const penetration = circle.radius - dist;
    addContact(circle, aabb, nx, ny, [{ px: closestX, py: closestY, penetration, cachedNormalImpulse: 0, cachedTangentImpulse: 0 }], contacts);
  }
}

function processAABBAABB(a: BodyState, b: BodyState, contacts: Contact[]) {
  const minAx = a.x - (a.halfW || 0), maxAx = a.x + (a.halfW || 0);
  const minAy = a.y - (a.halfH || 0), maxAy = a.y + (a.halfH || 0);
  const minBx = b.x - (b.halfW || 0), maxBx = b.x + (b.halfW || 0);
  const minBy = b.y - (b.halfH || 0), maxBy = b.y + (b.halfH || 0);

  const overlapX = Math.min(maxAx, maxBx) - Math.max(minAx, minBx);
  const overlapY = Math.min(maxAy, maxBy) - Math.max(minAy, minBy);

  if (overlapX > 0 && overlapY > 0) {
    let nx = 0, ny = 0;
    const points: { px: number, py: number, penetration: number, cachedNormalImpulse: number, cachedTangentImpulse: number }[] = [];

    if (overlapX < overlapY) {
      nx = b.x > a.x ? 1 : -1;
      const startY = Math.max(minAy, minBy);
      const endY = Math.min(maxAy, maxBy);
      const px = nx === 1 ? maxAx : minAx;
      points.push({ px, py: startY, penetration: overlapX, cachedNormalImpulse: 0, cachedTangentImpulse: 0 });
      points.push({ px, py: endY, penetration: overlapX, cachedNormalImpulse: 0, cachedTangentImpulse: 0 });
    } else {
      ny = b.y > a.y ? 1 : -1;
      const startX = Math.max(minAx, minBx);
      const endX = Math.min(maxAx, maxBx);
      const py = ny === 1 ? maxAy : minAy;
      points.push({ px: startX, py, penetration: overlapY, cachedNormalImpulse: 0, cachedTangentImpulse: 0 });
      points.push({ px: endX, py, penetration: overlapY, cachedNormalImpulse: 0, cachedTangentImpulse: 0 });
    }
    addContact(a, b, nx, ny, points, contacts);
  }
}

function processPolygonPolygon(a: BodyState, b: BodyState, contacts: Contact[]) {
  const polyA = a.worldVertices!;
  const polyB = b.worldVertices!;

  let minOverlap = Infinity;
  let nx = 0, ny = 0;

  const getAxes = (poly: {x:number, y:number}[]) => {
    const axes: {x:number, y:number}[] = [];
    for (let i = 0; i < poly.length; i++) {
        const v1 = poly[i];
        const v2 = poly[(i + 1) % poly.length];
        const edgeX = v2.x - v1.x;
        const edgeY = v2.y - v1.y;
        const len = Math.hypot(edgeX, edgeY);
        if (len > 1e-9) axes.push({ x: -edgeY/len, y: edgeX/len });
    }
    return axes;
  };

  const project = (poly: {x:number, y:number}[], ax: number, ay: number) => {
    let min = Infinity, max = -Infinity;
    for (const v of poly) {
        const dot = v.x * ax + v.y * ay;
        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }
    return { min, max };
  };

  const axes = [...getAxes(polyA), ...getAxes(polyB)];

  for (const axis of axes) {
    const projA = project(polyA, axis.x, axis.y);
    const projB = project(polyB, axis.x, axis.y);
    const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);

    if (overlap <= 0) return;

    if (overlap < minOverlap) {
        minOverlap = overlap;
        nx = axis.x; ny = axis.y;
    }
  }

  // Ensure normal points from A to B
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx * nx + dy * ny < 0) { nx = -nx; ny = -ny; }

  // Contact point: find vertex of one poly that is deepest into the other
  // Simplification: just find the vertex of B deepest in A along the normal
  let bestV = polyB[0];
  let minDepth = Infinity;
  for (const v of polyB) {
      const dot = v.x * nx + v.y * ny;
      if (dot < minDepth) { minDepth = dot; bestV = v; }
  }

  addContact(a, b, nx, ny, [{ px: bestV.x, py: bestV.y, penetration: minOverlap, cachedNormalImpulse: 0, cachedTangentImpulse: 0 }], contacts);
}

function processCirclePolygon(circle: BodyState, polyBody: BodyState, contacts: Contact[]) {
    const poly = polyBody.worldVertices!;
    let minOverlap = Infinity;
    let nx = 0, ny = 0;

    const project = (poly: {x:number, y:number}[], ax: number, ay: number) => {
        let min = Infinity, max = -Infinity;
        for (const v of poly) {
            const dot = v.x * ax + v.y * ay;
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }
        return { min, max };
    };

    // Axes: poly edges
    const axes: {x:number, y:number}[] = [];
    let closestV = poly[0];
    let minDist2 = Infinity;

    for (let i = 0; i < poly.length; i++) {
        const v1 = poly[i];
        const v2 = poly[(i + 1) % poly.length];
        const edgeX = v2.x - v1.x;
        const edgeY = v2.y - v1.y;
        const len = Math.hypot(edgeX, edgeY);
        if (len > 1e-9) axes.push({ x: -edgeY/len, y: edgeX/len });

        const dx = circle.x - v1.x;
        const dy = circle.y - v1.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < minDist2) { minDist2 = d2; closestV = v1; }
    }

    // Axis: circle center to closest vertex
    const cdx = closestV.x - circle.x;
    const cdy = closestV.y - circle.y;
    const clen = Math.hypot(cdx, cdy);
    if (clen > 1e-9) axes.push({ x: cdx/clen, y: cdy/clen });

    for (const axis of axes) {
        const projP = project(poly, axis.x, axis.y);
        const cDot = circle.x * axis.x + circle.y * axis.y;
        const projC = { min: cDot - circle.radius, max: cDot + circle.radius };

        const overlap = Math.min(projP.max, projC.max) - Math.max(projP.min, projC.min);
        if (overlap <= 0) return;

        if (overlap < minOverlap) {
            minOverlap = overlap;
            nx = axis.x; ny = axis.y;
        }
    }

    const dx = polyBody.x - circle.x;
    const dy = polyBody.y - circle.y;
    if (dx * nx + dy * ny < 0) { nx = -nx; ny = -ny; }

    const px = circle.x + nx * circle.radius;
    const py = circle.y + ny * circle.radius;
    addContact(circle, polyBody, nx, ny, [{ px, py, penetration: minOverlap, cachedNormalImpulse: 0, cachedTangentImpulse: 0 }], contacts);
}

function processPolygonAABB(poly: BodyState, aabb: BodyState, contacts: Contact[]) {
    // Convert AABB to poly vertices
    const hw = aabb.halfW || 0;
    const hh = aabb.halfH || 0;
    const aabbVertices = [
        { x: aabb.x - hw, y: aabb.y - hh },
        { x: aabb.x + hw, y: aabb.y - hh },
        { x: aabb.x + hw, y: aabb.y + hh },
        { x: aabb.x - hw, y: aabb.y + hh }
    ];
    
    // Create temporary BodyState for AABB as polygon
    const tempAABBBody = { ...aabb, worldVertices: aabbVertices, shape: 'polygon' as const };
    processPolygonPolygon(poly, tempAABBBody, contacts);
}

function processCirclePolyline(circle: BodyState, polylineBody: BodyState, contacts: Contact[]) {
  const points = polylineBody.worldVertices!;
  if (points.length < 2) return;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i+1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-9) continue;

    let t = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));

    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const cdx = circle.x - closestX;
    const cdy = circle.y - closestY;
    const dist2 = cdx * cdx + cdy * cdy;

    if (dist2 < circle.radius * circle.radius) {
      const dist = Math.sqrt(dist2);
      
      // Calculate segment normal (pointing UP from ground segment direction)
      const len = Math.sqrt(len2);
      let nx = -dy / len;
      let ny = dx / len;

      // Ensure normal points towards the circle center
      if (cdx * nx + cdy * ny < 0) { nx = -nx; ny = -ny; }

      const penetration = circle.radius - dist;

      // addContact normal points from A to B (Circle to Polyline)
      // So use the inverted normal to push the circle OUT
      addContact(circle, polylineBody, -nx, -ny, [{
        px: closestX,
        py: closestY,
        penetration,
        cachedNormalImpulse: 0,
        cachedTangentImpulse: 0
      }], contacts);
    }
  }
}

function processAABBPolyline(aabb: BodyState, polyline: BodyState, contacts: Contact[]) {
    const hw = aabb.halfW || 0;
    const hh = aabb.halfH || 0;
    const aabbVertices = [
        { x: aabb.x - hw, y: aabb.y - hh },
        { x: aabb.x + hw, y: aabb.y - hh },
        { x: aabb.x + hw, y: aabb.y + hh },
        { x: aabb.x - hw, y: aabb.y + hh }
    ];
    const tempAABB = { ...aabb, worldVertices: aabbVertices, shape: 'polygon' as const };
    processPolygonPolyline(tempAABB, polyline, contacts);
}

function processPolygonPolyline(poly: BodyState, polyline: BodyState, contacts: Contact[]) {
    const polyPoints = poly.worldVertices!;
    const linePoints = polyline.worldVertices!;
    if (linePoints.length < 2) return;

    for (let i = 0; i < linePoints.length - 1; i++) {
        const p1 = linePoints[i];
        const p2 = linePoints[i+1];
        
        // Treat segment as a very thin polygon or just do Segment-Polygon SAT
        // For Phase 1, we can find poly vertices that are below the segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) continue;
        
        const nx = -dy / len;
        const ny = dx / len;
        
        // Check poly vertices against segment line
        for (const v of polyPoints) {
            const vdx = v.x - p1.x;
            const vdy = v.y - p1.y;
            
            // Projection onto normal
            const dist = vdx * nx + vdy * ny;
            
            // Projection onto segment
            const t = (vdx * dx + vdy * dy) / (len * len);
            
            if (t >= 0 && t <= 1 && dist < 0) {
                // Collision!
                addContact(poly, polyline, -nx, -ny, [{
                    px: v.x,
                    py: v.y,
                    penetration: -dist,
                    cachedNormalImpulse: 0,
                    cachedTangentImpulse: 0
                }], contacts);
            }
        }
    }
}

function addContact(a: BodyState, b: BodyState, nx: number, ny: number, points: any[], contacts: Contact[]) {
  const sortedIds = [a.id, b.id].sort();
  const contactId = `${sortedIds[0]}:${sortedIds[1]}`;
  contacts.push({ id: contactId, aId: a.id, bId: b.id, nx, ny, points });
}

export interface StepOptions {
  iterations?: number;
  velocityIterations?: number;
  positionIterations?: number;
  warmStart?: boolean;
  beta?: number;
  slop?: number;
  ccd?: boolean;
  dt?: number;
  joints?: Joint[];
  broadPhase?: BroadPhaseOptions;
}

export function stepCollisionPipeline(bodies: BodyState[], options: StepOptions = {}) {
  const {
    velocityIterations = (options.iterations !== undefined ? options.iterations : 8),
    positionIterations = (options.iterations !== undefined ? options.iterations : 6),
    warmStart = true,
    beta = 0.18,
    slop = 0.005,
    ccd = false,
    dt = 1/60,
    joints = [],
    broadPhase = {}
  } = options;

  for (const b of bodies) {
    if (b.shape === 'polygon' && b.localVertices) {
      const cos = Math.cos(b.angle);
      const sin = Math.sin(b.angle);
      b.worldVertices = b.localVertices.map(v => ({
        x: b.x + (v.x * cos - v.y * sin),
        y: b.y + (v.x * sin + v.y * cos)
      }));
    }
  }

  let ccdEvents = 0;
  if (ccd && dt > 0) {
    const candidates = computeCandidates(bodies, dt, broadPhase);
    for (const [a, b] of candidates) {
       let toi: number | null = null;
       if (a.shape === 'circle' && b.shape === 'circle') {
          toi = timeOfImpactCircleCircle(a, b, dt);
       } else if (a.shape === 'circle' && b.shape === 'aabb') {
          toi = timeOfImpactCircleAABB(a, b, dt);
       } else if (a.shape === 'aabb' && b.shape === 'circle') {
          toi = timeOfImpactCircleAABB(b, a, dt);
       } else if (a.shape === 'aabb' && b.shape === 'aabb') {
          toi = timeOfImpactAABBAABB(a, b, dt);
       } else if (a.shape === 'polygon' && b.shape === 'polygon') {
          toi = timeOfImpactPolygonPolygon(a, b, dt);
       }

       if (toi !== null && toi < 1) {
          const t = toi * dt;
          a.x += a.vx * t; a.y += a.vy * t;
          b.x += b.vx * t; b.y += b.vy * t;
          ccdEvents++;
       }
    }
  }

  const vIter = Math.max(1, Math.floor(velocityIterations));
  const pIter = Math.max(1, Math.floor(positionIterations));
  const bodyMap = new Map(bodies.map(b => [b.id, b]));
  const contacts = detectContacts(bodies, dt, broadPhase, joints);
  let warmStartedCount = 0;

  if (warmStart) {
    for (const contact of contacts) {
      const a = bodyMap.get(contact.aId);
      const b = bodyMap.get(contact.bId);
      if (!a || !b) continue;

      for (let i = 0; i < contact.points.length; i++) {
        const point = contact.points[i];
        const cacheKey = `${contact.id}_${i}`;
        const cached = impulseCache.get(cacheKey);
        
        if (cached) {
          const in_x = cached.jn * contact.nx;
          const in_y = cached.jn * contact.ny;
          
          const ra_x = point.px - a.x, ra_y = point.py - a.y;
          const rb_x = point.px - b.x, rb_y = point.py - b.y;

          a.vx -= in_x * a.invMass;
          a.vy -= in_y * a.invMass;
          b.vx += in_x * b.invMass;
          b.vy += in_y * b.invMass;
          
          a.omega -= (ra_x * in_y - ra_y * in_x) * a.invInertia;
          b.omega += (rb_x * in_y - rb_y * in_x) * b.invInertia;

          point.cachedNormalImpulse = cached.jn;

          const vax = a.vx + (-a.omega * ra_y), vay = a.vy + (a.omega * ra_x);
          const vbx = b.vx + (-b.omega * rb_y), vby = b.vy + (b.omega * rb_x);
          const rvx = vbx - vax, rvy = vby - vay;
          const vn = rvx * contact.nx + rvy * contact.ny;
          let tx = rvx - vn * contact.nx, ty = rvy - vn * contact.ny;
          const tLen = Math.hypot(tx, ty);
          if (tLen > 1e-9) {
            tx /= tLen; ty /= tLen;
            const it_x = cached.jt * tx, it_y = cached.jt * ty;
            a.vx -= it_x * a.invMass; a.vy -= it_y * a.invMass;
            b.vx += it_x * b.invMass; b.vy += it_y * b.invMass;
            
            a.omega -= (ra_x * it_y - ra_y * it_x) * a.invInertia;
            b.omega += (rb_x * it_y - rb_y * it_x) * b.invInertia;
            
            point.cachedTangentImpulse = cached.jt;
          }
          warmStartedCount++;
        }
      }
    }
  }

  let totalImpulse = 0, totalCorrection = 0;
  for (let i = 0; i < vIter; i++) {
    totalImpulse += resolveContacts(bodyMap, contacts);
    for (const joint of joints) {
      const a = bodyMap.get(joint.bodyIdA);
      const b = bodyMap.get(joint.bodyIdB);
      if (!a || !b) continue;
      if (joint.type === 'distance') solveDistanceVelocity(joint, a, b, dt / vIter);
      else if (joint.type === 'revolute') solveRevoluteVelocity(joint, a, b, dt / vIter);
      else if (joint.type === 'prismatic') solvePrismaticVelocity(joint, a, b, dt / vIter);
      else if (joint.type === 'wheel') solveWheelVelocity(joint, a, b, dt / vIter);
      else if (joint.type === 'weld') solveWeldVelocity(joint, a, b);
    }
  }
  for (let i = 0; i < pIter; i++) {
    totalCorrection += stabilizeContacts(bodyMap, contacts, beta, slop);
    for (const joint of joints) {
      const a = bodyMap.get(joint.bodyIdA);
      const b = bodyMap.get(joint.bodyIdB);
      if (!a || !b) continue;
      if (joint.type === 'distance') totalCorrection += solveDistancePosition(joint, a, b, beta);
      else if (joint.type === 'revolute') totalCorrection += solveRevolutePosition(joint, a, b, beta);
      else if (joint.type === 'prismatic') totalCorrection += solvePrismaticPosition(joint, a, b, beta);
      else if (joint.type === 'wheel') totalCorrection += solveWheelPosition(joint, a, b, beta);
      else if (joint.type === 'weld') totalCorrection += solveWeldPosition(joint, a, b, beta);
    }
  }

  const currentFrameKeys = new Set<string>();
  for (const contact of contacts) {
    for (let i = 0; i < contact.points.length; i++) {
      const key = `${contact.id}_${i}`;
      currentFrameKeys.add(key);
      impulseCache.set(key, { jn: contact.points[i].cachedNormalImpulse, jt: contact.points[i].cachedTangentImpulse });
    }
  }
  for (const key of impulseCache.keys()) if (!currentFrameKeys.has(key)) impulseCache.delete(key);

  return {
    contacts: contacts.length,
    impulse: totalImpulse,
    correction: totalCorrection,
    velocityIterations: vIter,
    positionIterations: pIter,
    warmStartedContacts: warmStartedCount,
    ccdEvents
  };
}
