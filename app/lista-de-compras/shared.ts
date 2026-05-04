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