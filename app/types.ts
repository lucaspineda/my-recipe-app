export interface Plan {
  id: number;
  cost: number;
  description: string;
  name: string;
  recommended: boolean;
  active?: boolean;
}

export interface UserPlan {
  planId: number;
  cost: number;
  updatedat: Date;
}
