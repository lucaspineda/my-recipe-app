import {
  RecipeIngredientInput,
  buildRecipeShoppingDraftItems,
  getRecipeIngredientParts,
  normalizeShoppingItemName,
} from '../../../lista-de-compras/shared';

export { buildRecipeShoppingDraftItems, normalizeShoppingItemName };

export const getRecipeIngredientDisplayText = (ingredient: RecipeIngredientInput) => {
  const { name, quantityText } = getRecipeIngredientParts(ingredient);

  if (!name) return '';
  return quantityText ? `${name} - ${quantityText}` : name;
};
