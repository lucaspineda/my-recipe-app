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
  updatedAt?: Timestamp | FieldValue;
  expiresAt?: Timestamp | FieldValue;
  name: string;
  recipeCount?: number;
  toBeCanceled?: boolean;
}

// Written only by the backend from Stripe events (firestore.rules doesn't let the browser change it).
export interface UserBilling {
  customerId?: string | null;
  subscriptionId?: string | null;
  // Stripe subscription status: active, past_due (a renewal failed, Stripe is retrying), canceled, ...
  status?: string | null;
  paymentFailedAt?: Timestamp | null;
  nextPaymentAttemptAt?: Timestamp | null;
  cancelAt?: Timestamp | null;
}

export interface User {
  uid: string;
  email: string;
  plan: UserPlan;
  billing?: UserBilling;
  lastLoginAt: Date;
  name?: string;
  surveyCompletedAt?: Timestamp;
}
