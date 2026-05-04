'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Check, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { db } from '../../../hooks/userAuth';
import { useUserStore } from '../../../store/user';
import { useToast } from '../../../hooks/use-toast';
import { trackPageVisit } from '../../../lib/analytics';
import { INGREDIENTES } from '../../../components/IngredientsInput/constants';
import { ShoppingItem, ShoppingList } from '../../shared';

const BRAZILIAN_MARKET_PRIORITY = [
  'arroz',
  'feijão',
  'óleo',
  'azeite',
  'sal',
  'açúcar',
  'café',
  'leite',
  'ovo',
  'manteiga',
  'queijo',
  'frango',
  'carne',
  'carne moída',
  'linguiça',
  'presunto',
  'tomate',
  'cebola',
  'alho',
  'batata',
  'cenoura',
  'alface',
  'banana',
  'maçã',
  'limão',
  'pão',
  'macarrão',
  'molho de tomate',
  'farinha de trigo',
  'farinha',
  'milho',
  'aveia',
  'iogurte',
  'creme de leite',
  'repolho',
  'pepino',
  'pimentão',
  'brócolis',
  'couve',
  'batata-doce',
  'tapioca',
  'maionese',
  'ketchup',
  'mostarda',
  'vinagre',
  'pimenta-do-reino',
  'orégano',
];

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const priorityMap = new Map(
  BRAZILIAN_MARKET_PRIORITY.map((item, index) => [normalizeName(item), index]),
);

const compareSuggestions = (first: string, second: string) => {
  const firstPriority = priorityMap.get(normalizeName(first)) ?? Number.MAX_SAFE_INTEGER;
  const secondPriority = priorityMap.get(normalizeName(second)) ?? Number.MAX_SAFE_INTEGER;

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  return first.localeCompare(second, 'pt-BR');
};

export default function AddShoppingListItemsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const listId = params.id as string;
  const inputRef = useRef<HTMLInputElement>(null);

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingItemName, setSavingItemName] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackPageVisit('shopping-list-add-items');
  }, []);

  useEffect(() => {
    if (!user?.uid || !listId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeList = onSnapshot(
      doc(db, 'shoppingLists', listId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setList(null);
          setError('Lista não encontrada.');
          setLoading(false);
          return;
        }

        const nextList = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<ShoppingList, 'id'>),
        };

        if (nextList.userId !== user.uid) {
          setList(null);
          setError('Você não tem acesso a esta lista.');
          setLoading(false);
          return;
        }

        setList(nextList);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Error loading shopping list:', snapshotError);
        setError('Não foi possível carregar a lista.');
        setLoading(false);
      },
    );

    const unsubscribeItems = onSnapshot(
      collection(db, 'shoppingLists', listId, 'items'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...(snapshotDoc.data() as Omit<ShoppingItem, 'id'>),
        }));
        setItems(nextItems);
      },
      (snapshotError) => {
        console.error('Error loading shopping list items:', snapshotError);
      },
    );

    return () => {
      unsubscribeList();
      unsubscribeItems();
    };
  }, [listId, user?.uid]);

  const existingItemNames = useMemo(
    () => new Set(items.map((item) => normalizeName(item.name))),
    [items],
  );

  const existingItemsByName = useMemo(
    () =>
      new Map(items.map((item) => [normalizeName(item.name), item])),
    [items],
  );

  const normalizedSearch = normalizeName(searchTerm);

  const filteredSuggestions = useMemo(() => {
    const baseSuggestions = INGREDIENTES.filter((ingredient) => {
      if (!normalizedSearch) return true;
      return normalizeName(ingredient).includes(normalizedSearch);
    })
      .sort(compareSuggestions)
      .slice(0, 30);

    if (normalizedSearch && !existingItemNames.has(normalizedSearch)) {
      const hasExactSuggestion = baseSuggestions.some(
        (ingredient) => normalizeName(ingredient) === normalizedSearch,
      );

      if (!hasExactSuggestion) {
        return [searchTerm.trim(), ...baseSuggestions];
      }
    }

    return baseSuggestions;
  }, [existingItemNames, normalizedSearch, searchTerm]);

  const handleAddItem = async (name: string) => {
    const trimmedName = name.trim();
    const normalizedName = normalizeName(trimmedName);

    if (!list || !trimmedName) return;

    if (existingItemNames.has(normalizedName)) {
      toast({
        title: 'Item já está na lista',
        description: 'Escolha outro item ou volte para a lista para editar o existente.',
      });
      return;
    }

    setSavingItemName(trimmedName);

    try {
      await addDoc(collection(db, 'shoppingLists', list.id, 'items'), {
        name: trimmedName,
        quantityText: null,
        checked: false,
        sourceType: 'manual',
        sourceRecipeId: null,
        sourceRecipeTitle: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'shoppingLists', list.id), {
        itemCount: (list.itemCount ?? items.length) + 1,
        pendingItemCount: (list.pendingItemCount ?? items.filter((item) => !item.checked).length) + 1,
        updatedAt: serverTimestamp(),
      });

      setAddedCount((currentAddedCount) => currentAddedCount + 1);
      setSearchTerm('');
      inputRef.current?.focus();
    } catch (addError) {
      console.error('Error adding shopping list item:', addError);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o item agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingItemName(null);
    }
  };

  const handleRemoveItem = async (name: string) => {
    const normalizedName = normalizeName(name);
    const existingItem = existingItemsByName.get(normalizedName);

    if (!list || !existingItem) return;

    setSavingItemName(name);

    try {
      await deleteDoc(doc(db, 'shoppingLists', list.id, 'items', existingItem.id));

      await updateDoc(doc(db, 'shoppingLists', list.id), {
        itemCount: Math.max(0, (list.itemCount ?? items.length) - 1),
        pendingItemCount: Math.max(
          0,
          (list.pendingItemCount ?? items.filter((item) => !item.checked).length) - (existingItem.checked ? 0 : 1),
        ),
        updatedAt: serverTimestamp(),
      });

      setAddedCount((currentAddedCount) => Math.max(0, currentAddedCount - 1));
      inputRef.current?.focus();
    } catch (removeError) {
      console.error('Error removing shopping list item:', removeError);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingItemName(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <main className="container mx-auto max-w-4xl px-0">
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-tertiary/40 bg-primary">
                <ShoppingCart className="h-10 w-10 text-tertiary" />
              </div>
              <h1 className="mb-3 text-2xl font-semibold text-gray-800">Faça login para continuar</h1>
              <p className="mx-auto mb-8 max-w-xl text-gray-600">
                Entre na sua conta para adicionar itens à lista.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-white no-underline transition-colors hover:bg-secondary/90"
              >
                Entrar
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 pt-8">
      <main className="container mx-auto max-w-4xl px-0">
        <div className="mb-6">
          <Link
            href={`/lista-de-compras/${listId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-secondary no-underline hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Link>

          <h1 className="text-3xl font-bold text-secondary">Adicionar itens</h1>
          <p className="mt-2 text-gray-600">
            {loading ? 'Carregando lista...' : list ? `Adicionando itens em ${list.name}.` : 'Selecione itens para adicionar.'}
          </p>
        </div>

        {error ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <p className="text-center font-medium text-red-600">{error}</p>
          </Card>
        ) : (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-3 sm:p-4 shadow-sm">
            <div className="sticky top-0 z-10 mb-4 bg-white pb-3">
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Digite para filtrar ou adicionar um item"
                className="border-secondary/20 focus-visible:ring-secondary"
              />
            </div>

            <div className="space-y-2">
              {filteredSuggestions.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  Nenhuma sugestão encontrada.
                </p>
              ) : (
                filteredSuggestions.map((suggestion) => {
                  const isExisting = existingItemNames.has(normalizeName(suggestion));
                  const isSaving = savingItemName === suggestion;

                  return (
                    <div
                      key={suggestion}
                      className="flex items-center justify-between gap-3 rounded-xl border border-tertiary/20 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">{suggestion}</p>
                        {isExisting && <p className="text-sm text-gray-400">Já está nesta lista</p>}
                      </div>

                      <button
                        type="button"
                        onClick={() => (isExisting ? handleRemoveItem(suggestion) : handleAddItem(suggestion))}
                        disabled={Boolean(savingItemName)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                          isExisting
                            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border-secondary/30 text-secondary hover:bg-secondary hover:text-white'
                        }`}
                        aria-label={isExisting ? `Remover ${suggestion}` : `Adicionar ${suggestion}`}
                      >
                        {isExisting ? (
                          <Trash2 className="h-4 w-4" />
                        ) : isSaving ? (
                          <span className="text-xs font-semibold">...</span>
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}
      </main>

      {addedCount > 0 && !error && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 lg:bottom-8">
          <Button
            onClick={() => router.push(`/lista-de-compras/${listId}`)}
            className="pointer-events-auto w-full max-w-sm rounded-full bg-secondary px-6 py-6 text-white shadow-lg hover:bg-secondary/90"
          >
            <Check className="h-4 w-4" />
            Concluir e voltar ({addedCount})
          </Button>
        </div>
      )}
    </div>
  );
}