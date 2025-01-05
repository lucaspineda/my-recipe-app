import { FieldValue, Timestamp } from "firebase/firestore";

export interface Plan {
  id: number;
  cost: number;
  description: string;
  name: string;
  recommended: boolean;
  active?: boolean;
  recipeCount?: number;
}

export interface UserPlan {
  planId: number;
  cost: number;
  startedAt: Timestamp | FieldValue;
  expiresAt: Timestamp | FieldValue;
  name: string;
  recipesCount?: number;
}

export interface User {
  email: string;
  plan: UserPlan;
  lastLoginAt: Date;
  name?: string;
}
