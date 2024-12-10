import { create } from 'zustand'

interface UserStore {
  userPlanId?: number;
  setUserPlanId: (userPlanId: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  userPlanId: null,
  setUserPlanId: (userPlanId) => set(() => ({ userPlanId })),
}))