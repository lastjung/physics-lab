import { BodyState } from '../collision/types';

export type JointType = 'distance' | 'revolute';

export interface BaseJoint {
  id: string;
  bodyIdA: string;
  bodyIdB: string;
  localAnchorA: { x: number; y: number };
  localAnchorB: { x: number; y: number };
}

export interface DistanceJoint extends BaseJoint {
  type: 'distance';
  length: number;
  frequency?: number; // For soft joints (optional)
  dampingRatio?: number; // (optional)
}

export interface RevoluteJoint extends BaseJoint {
  type: 'revolute';
}

export type Joint = DistanceJoint | RevoluteJoint;
