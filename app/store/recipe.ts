import { create } from 'zustand'

interface RecipeStore {
  ingredients: string | null;
  mealOption: string | null;
  updateIngredients: (ingredients: string | null) => void
  updateMealOption: (mealOption: string | null) => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  ingredients: '',
  mealOption: '',
  updateIngredients: (ingredients) => set(() => ({ ingredients: ingredients })),
  updateMealOption: (mealOption) => set(() => ({ mealOption: mealOption })),
}))