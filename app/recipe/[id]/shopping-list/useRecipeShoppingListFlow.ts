'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../hooks/userAuth';
import { useToast } from '../../../hooks/use-toast';
import { trackEvent } from '../../../lib/analytics';
import { ShoppingItem, ShoppingList, sortLists } from '../../../lista-de-compras/shared';
import {
  RecipeIngredientInput,
  RecipeShoppingDraftItem,
  RecipeShoppingListSaveResult,
  RecipeShoppingListUser,
  ShoppingListFlowStep,
} from './types';
import { buildRecipeShoppingDraftItems, normalizeShoppingItemName } from './utils';

interface UseRecipeShoppingListFlowParams {
  recipeId: string;
  recipeTitle?: string;
  recipeIngredients?: RecipeIngredientInput[];
  user: RecipeShoppingListUser | null;
  isOwnRecipe: boolean;
}

export function useRecipeShoppingListFlow({
  recipeId,
  recipeTitle,
  recipeIngredients,
  user,
  isOwnRecipe,
}: UseRecipeShoppingListFlowParams) {
  const router = useRouter();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<ShoppingListFlowStep>('select-list');
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [preparingItems, setPreparingItems] = useState(false);
  const [draftItems, setDraftItems] = useState<RecipeShoppingDraftItem[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [saveResult, setSaveResult] = useState<RecipeShoppingListSaveResult | null>(null);

  const resetFlow = () => {
    setStep('select-list');
    setSelectedList(null);
    setShowCreateList(false);
    setListName('');
    setPreparingItems(false);
    setDraftItems([]);
    setSavingItems(false);
    setSaveResult(null);
  };

  const openModal = () => {
    if (!user?.uid) {
      trackEvent('shopping_list_recipe_login_redirect', {
        recipeId,
        source: 'recipe_ingredients',
      });
      router.push('/login');
      return;
    }

    const nextDraftItems = buildRecipeShoppingDraftItems(recipeIngredients);
    if (!nextDraftItems.length) {
      toast({
        title: 'Sem ingredientes',
        description: 'Não encontramos ingredientes suficientes para montar a lista.',
        variant: 'destructive',
      });
      return;
    }

    resetFlow();
    trackEvent('shopping_list_cta_click', {
      recipeId,
      source: 'recipe_ingredients',
      isLoggedIn: Boolean(user),
      isOwnRecipe,
    });
    trackEvent('shopping_list_recipe_modal_opened', {
      recipeId,
      source: 'recipe_ingredients',
      ingredientCount: nextDraftItems.length,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalOpen) {
      trackEvent('shopping_list_modal_closed', {
        recipeId,
        source: 'recipe_ingredients',
        step,
      });
    }

    setModalOpen(false);
    resetFlow();
  };

  const prepareItems = async (list: ShoppingList) => {
    const nextDraftItems = buildRecipeShoppingDraftItems(recipeIngredients);

    if (!nextDraftItems.length) {
      toast({
        title: 'Sem ingredientes',
        description: 'Não encontramos ingredientes suficientes para adicionar.',
        variant: 'destructive',
      });
      return;
    }

    setPreparingItems(true);

    try {
      const existingItemsSnapshot = await getDocs(collection(db, 'shoppingLists', list.id, 'items'));
      const existingItemNames = new Set(
        existingItemsSnapshot.docs
          .map((snapshotDoc) => (snapshotDoc.data() as Omit<ShoppingItem, 'id'>).name)
          .map((name) => normalizeShoppingItemName(name || ''))
          .filter(Boolean),
      );

      const nextItems = nextDraftItems.map((item) => {
        const alreadyInList = existingItemNames.has(item.normalizedName);

        return {
          ...item,
          alreadyInList,
          selected: alreadyInList ? false : item.selected,
        };
      });

      setSelectedList(list);
      setDraftItems(nextItems);
      setStep('confirm-items');
      setShowCreateList(false);

      trackEvent('shopping_list_recipe_list_selected', {
        recipeId,
        source: 'recipe_ingredients',
        listId: list.id,
        listName: list.name,
      });
    } catch (shoppingListError) {
      console.error('Error preparing shopping list items:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível preparar os ingredientes agora.',
        variant: 'destructive',
      });
    } finally {
      setPreparingItems(false);
    }
  };

  const createList = async () => {
    const trimmedName = listName.trim();

    if (!user?.uid || !trimmedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a lista.',
        variant: 'destructive',
      });
      return;
    }

    setSavingList(true);

    try {
      const listRef = await addDoc(collection(db, 'shoppingLists'), {
        userId: user.uid,
        name: trimmedName,
        status: 'active',
        itemCount: 0,
        pendingItemCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const nextList: ShoppingList = {
        id: listRef.id,
        userId: user.uid,
        name: trimmedName,
        status: 'active',
        itemCount: 0,
        pendingItemCount: 0,
      };

      setListName('');
      setSelectedList(nextList);
      trackEvent('shopping_list_recipe_list_created', {
        recipeId,
        source: 'recipe_ingredients',
        listId: listRef.id,
      });

      await prepareItems(nextList);
    } catch (shoppingListError) {
      console.error('Error creating shopping list from recipe:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingList(false);
    }
  };

  const toggleDraftItem = (draftItemId: string) => {
    setDraftItems((currentDraftItems) =>
      currentDraftItems.map((draftItem) => {
        if (draftItem.id !== draftItemId || draftItem.alreadyInList) {
          return draftItem;
        }

        return {
          ...draftItem,
          selected: !draftItem.selected,
        };
      }),
    );
  };

  const saveItems = async () => {
    if (!selectedList || !recipeTitle) return;

    const itemsToAdd = draftItems.filter((item) => item.selected && !item.alreadyInList);
    setSavingItems(true);

    try {
      const batch = writeBatch(db);
      const shoppingListRef = doc(db, 'shoppingLists', selectedList.id);

      itemsToAdd.forEach((item) => {
        const itemRef = doc(collection(db, 'shoppingLists', selectedList.id, 'items'));
        batch.set(itemRef, {
          name: item.name,
          quantityText: item.quantityText,
          checked: false,
          sourceType: 'recipe',
          sourceRecipeId: recipeId,
          sourceRecipeTitle: recipeTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      if (itemsToAdd.length > 0) {
        batch.update(shoppingListRef, {
          itemCount: (selectedList.itemCount ?? 0) + itemsToAdd.length,
          pendingItemCount: (selectedList.pendingItemCount ?? 0) + itemsToAdd.length,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.update(shoppingListRef, {
          updatedAt: serverTimestamp(),
        });
      }

      trackEvent('shopping_list_recipe_items_confirmed', {
        recipeId,
        source: 'recipe_ingredients',
        listId: selectedList.id,
        selectedCount: itemsToAdd.length,
        skippedCount: draftItems.length - itemsToAdd.length,
      });

      await batch.commit();

      setSaveResult({
        addedCount: itemsToAdd.length,
        listId: selectedList.id,
        listName: selectedList.name,
      });
      setStep('success');

      trackEvent('shopping_list_recipe_items_added', {
        recipeId,
        source: 'recipe_ingredients',
        listId: selectedList.id,
        addedCount: itemsToAdd.length,
      });
    } catch (shoppingListError) {
      console.error('Error saving recipe ingredients to shopping list:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingItems(false);
    }
  };

  const continueViewingRecipe = () => {
    if (!saveResult) return;

    trackEvent('shopping_list_recipe_success_continue_recipe', {
      recipeId,
      listId: saveResult.listId,
    });
    closeModal();
  };

  const viewShoppingList = () => {
    if (!saveResult) return;

    const nextListId = saveResult.listId;
    trackEvent('shopping_list_recipe_success_view_list', {
      recipeId,
      listId: nextListId,
    });
    closeModal();
    router.push(`/lista-de-compras/${nextListId}`);
  };

  useEffect(() => {
    if (!modalOpen || !user?.uid) {
      if (!modalOpen) {
        setLists([]);
        setLoadingLists(false);
      }
      return;
    }

    setLoadingLists(true);

    const listsQuery = query(
      collection(db, 'shoppingLists'),
      where('userId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(
      listsQuery,
      (snapshot) => {
        const nextLists = sortLists(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...(snapshotDoc.data() as Omit<ShoppingList, 'id'>),
          })),
        );

        setLists(nextLists);
        setLoadingLists(false);
        setSelectedList((currentSelectedList) => {
          if (currentSelectedList) {
            return nextLists.find((list) => list.id === currentSelectedList.id) ?? currentSelectedList;
          }

          return nextLists[0] ?? null;
        });
      },
      (shoppingListError) => {
        console.error('Error loading shopping lists from recipe:', shoppingListError);
        setLoadingLists(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas listas agora.',
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [modalOpen, toast, user?.uid]);

  return {
    modalOpen,
    step,
    lists,
    loadingLists,
    selectedList,
    showCreateList,
    listName,
    savingList,
    preparingItems,
    draftItems,
    savingItems,
    saveResult,
    setSelectedList,
    setShowCreateList,
    setListName,
    setStep,
    openModal,
    closeModal,
    prepareItems,
    createList,
    toggleDraftItem,
    saveItems,
    continueViewingRecipe,
    viewShoppingList,
  };
}
