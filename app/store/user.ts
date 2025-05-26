import { create } from 'zustand'
import { User } from '../types';

interface UserStore {
  user?: User;
  setUser: (user: User) => void;
  updateRecipesCount: (count: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set(() => ({ user })),
  updateRecipesCount: (count) =>
    set((state) => {
      if (!state.user || !state.user.plan) return {};
      return {
        user: {
          ...state.user,
          plan: {
            ...state.user.plan,
            recipeCount: count,
          },
        },
      };
    }),
}))