import { create } from 'zustand'

interface RecipeStore {
  ingredients: string | null;
  mealOption: string | null;
  recipeLoading: boolean;
  updateIngredients: (ingredients: string | null) => void
  updateMealOption: (mealOption: string | null) => void
  setRecipeLoading: (recipeLoading: boolean) => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  ingredients: '',
  mealOption: '',
  recipeLoading: false,
  updateIngredients: (ingredients) => set(() => ({ ingredients })),
  updateMealOption: (mealOption) => set(() => ({ mealOption })),
  setRecipeLoading: (recipeLoading) => set(() => ({ recipeLoading })),
}))