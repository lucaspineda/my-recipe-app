export interface ShoppingList {
  id: string;
  userId?: string;
  name: string;
  status?: 'active' | 'archived';
  itemCount?: number;
  pendingItemCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantityText?: string | null;
  checked: boolean;
  sourceType?: 'manual' | 'recipe';
  sourceRecipeId?: string | null;
  sourceRecipeTitle?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export type RecipeIngredientInput =
  | string
  | {
      nome?: string;
      item?: string;
      quantidade?: string;
    };

export interface RecipeShoppingDraftItem {
  id: string;
  name: string;
  quantityText: string | null;
  normalizedName: string;
  selected: boolean;
  alreadyInList: boolean;
}

export const normalizeShoppingItemName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getRecipeIngredientParts = (ingredient: RecipeIngredientInput) => {
  if (typeof ingredient === 'string') {
    return {
      name: ingredient.trim(),
      quantityText: null,
    };
  }

  const name = `${ingredient?.nome || ingredient?.item || ''}`.trim();
  const quantityText = ingredient?.quantidade == null ? null : `${ingredient.quantidade}`.trim();

  return {
    name,
    quantityText: quantityText || null,
  };
};

export const buildRecipeShoppingDraftItems = (ingredients?: RecipeIngredientInput[]) => {
  if (!ingredients?.length) return [] as RecipeShoppingDraftItem[];

  const draftItems = new Map<string, RecipeShoppingDraftItem>();

  ingredients.forEach((ingredient, index) => {
    const { name, quantityText } = getRecipeIngredientParts(ingredient);
    const normalizedName = normalizeShoppingItemName(name);

    if (!name || !normalizedName) return;

    const existingItem = draftItems.get(normalizedName);
    if (existingItem) {
      if (!existingItem.quantityText && quantityText) {
        draftItems.set(normalizedName, {
          ...existingItem,
          quantityText,
        });
      }
      return;
    }

    draftItems.set(normalizedName, {
      id: `${normalizedName}-${index}`,
      name,
      quantityText,
      normalizedName,
      selected: true,
      alreadyInList: false,
    });
  });

  return Array.from(draftItems.values());
};

export const timestampToMillis = (value?: { toMillis?: () => number } | null) => {
  if (!value || typeof value.toMillis !== 'function') return 0;
  return value.toMillis();
};

export const sortLists = (nextLists: ShoppingList[]) =>
  [...nextLists].sort((first, second) => timestampToMillis(second.updatedAt) - timestampToMillis(first.updatedAt));

export const sortItems = (nextItems: ShoppingItem[]) =>
  [...nextItems].sort((first, second) => {
    if (first.checked !== second.checked) {
      return Number(first.checked) - Number(second.checked);
    }

    return timestampToMillis(second.updatedAt || second.createdAt) - timestampToMillis(first.updatedAt || first.createdAt);
  });