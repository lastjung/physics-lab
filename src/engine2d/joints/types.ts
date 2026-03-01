import { BodyState } from '../collision/types';

export type JointType = 'distance' | 'revolute' | 'prismatic';

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
  // Relative angle = (angleB - angleA) - referenceAngle
  referenceAngle?: number;
  // Motor
  motorEnabled?: boolean;
  motorSpeed?: number;
  maxMotorTorque?: number;
  // Angular limits on relative angle
  limitEnabled?: boolean;
  lowerAngle?: number;
  upperAngle?: number;
}

export interface PrismaticJoint extends BaseJoint {
  type: 'prismatic';
  localAxisA: { x: number; y: number };
  referenceAngle?: number;
  // Motor
  motorEnabled?: boolean;
  motorSpeed?: number;
  maxMotorForce?: number;
  // Limits
  limitEnabled?: boolean;
  lowerTranslation?: number;
  upperTranslation?: number;
}

export type Joint = DistanceJoint | RevoluteJoint | PrismaticJoint;
