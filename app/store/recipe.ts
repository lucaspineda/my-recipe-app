import { create } from 'zustand'

interface RecipeStore {
  recipe: string;
  ingredients: string | null;
  mealOption: string | null;
  recipeLoading: boolean;
  showRecipe: boolean;
  recipeOptions: any[];
  setRecipe: (recipe: string | null) => void
  updateIngredients: (ingredients: string | null) => void
  updateMealOption: (mealOption: string | null) => void
  setRecipeLoading: (recipeLoading: boolean) => void
  setShowRecipe: (recipeLoading: boolean) => void
  setRecipeOptions: (options: any[]) => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipe: '',
  ingredients: '',
  mealOption: '',
  recipeLoading: false,
  showRecipe: false,
  recipeOptions: [],
  setRecipe: (recipe) => set(() => ({ recipe })),
  updateIngredients: (ingredients) => set(() => ({ ingredients })),
  updateMealOption: (mealOption) => set(() => ({ mealOption })),
  setRecipeLoading: (recipeLoading) => set(() => ({ recipeLoading })),
  setShowRecipe: (showRecipe) => set(() => ({ showRecipe })),
  setRecipeOptions: (recipeOptions) => set(() => ({ recipeOptions })),
}))