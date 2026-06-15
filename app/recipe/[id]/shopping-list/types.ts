import { ShoppingList } from '../../../lista-de-compras/shared';

export type RecipeIngredientInput =
  | string
  | {
      nome?: string;
      item?: string;
      quantidade?: string;
    };

export type ShoppingListFlowStep = 'select-list' | 'confirm-items' | 'success';

export interface RecipeShoppingDraftItem {
  id: string;
  name: string;
  quantityText: string | null;
  normalizedName: string;
  selected: boolean;
  alreadyInList: boolean;
}

export interface RecipeShoppingListSaveResult {
  addedCount: number;
  listId: string;
  listName: string;
}

export interface RecipeShoppingListUser {
  uid?: string;
}

export interface RecipeShoppingListFlowState {
  modalOpen: boolean;
  step: ShoppingListFlowStep;
  lists: ShoppingList[];
  loadingLists: boolean;
  selectedList: ShoppingList | null;
  showCreateList: boolean;
  listName: string;
  savingList: boolean;
  preparingItems: boolean;
  draftItems: RecipeShoppingDraftItem[];
  savingItems: boolean;
  saveResult: RecipeShoppingListSaveResult | null;
}
