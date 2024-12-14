import { create } from 'zustand'
import { User } from '../types';

interface UserStore {
  user?: User;
  setUser: (user: User) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set(() => ({ user })),
}))