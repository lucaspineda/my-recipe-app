'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  ShoppingCart,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Package2,
  Plus,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import Modal from '../../components/Modal/Modal';
import { db } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { useToast } from '../../hooks/use-toast';
import { trackPageVisit } from '../../lib/analytics';
import { ShoppingItem, ShoppingList, sortItems } from '../shared';

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const listId = params.id as string;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [busyList, setBusyList] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    trackPageVisit('shopping-list-detail');
  }, []);

  useEffect(() => {
    if (!user?.uid || !listId) {
      setLoadingList(false);
      return;
    }

    setLoadingList(true);

    const unsubscribe = onSnapshot(
      doc(db, 'shoppingLists', listId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Lista não encontrada.');
          setList(null);
          setLoadingList(false);
          return;
        }

        const nextList = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<ShoppingList, 'id'>),
        };

        if (nextList.userId !== user.uid) {
          setError('Você não tem acesso a esta lista.');
          setList(null);
          setLoadingList(false);
          return;
        }

        setList(nextList);
        setListName(nextList.name);
        setError(null);
        setLoadingList(false);
      },
      (snapshotError) => {
        console.error('Error loading shopping list:', snapshotError);
        setError('Não foi possível carregar a lista.');
        setLoadingList(false);
      },
    );

    return () => unsubscribe();
  }, [listId, user?.uid]);

  useEffect(() => {
    if (!list?.id) {
      setItems([]);
      setLoadingItems(false);
      return;
    }

    setLoadingItems(true);

    const unsubscribe = onSnapshot(
      collection(db, 'shoppingLists', list.id, 'items'),
      (snapshot) => {
        const nextItems = sortItems(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...(snapshotDoc.data() as Omit<ShoppingItem, 'id'>),
          })),
        );

        setItems(nextItems);
        setLoadingItems(false);
      },
      (snapshotError) => {
        console.error('Error loading shopping list items:', snapshotError);
        setLoadingItems(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os itens desta lista.',
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [list?.id, toast]);

  const pendingItems = useMemo(() => items.filter((item) => !item.checked), [items]);
  const completedItems = useMemo(() => items.filter((item) => item.checked), [items]);

  const openRenameListDialog = () => {
    if (!list) return;
    setListName(list.name);
    setListDialogOpen(true);
  };

  const handleSaveList = async () => {
    const trimmedName = listName.trim();

    if (!list || !trimmedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a lista.',
        variant: 'destructive',
      });
      return;
    }

    setSavingList(true);

    try {
      await updateDoc(doc(db, 'shoppingLists', list.id), {
        name: trimmedName,
        updatedAt: serverTimestamp(),
      });

      setListDialogOpen(false);
      toast({
        title: 'Lista atualizada',
        description: 'O nome da lista foi atualizado.',
      });
    } catch (saveError) {
      console.error('Error saving shopping list:', saveError);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingList(false);
    }
  };

  const handleDeleteList = async () => {
    if (!list) return;

    const shouldDelete = window.confirm(`Excluir a lista "${list.name}"? Essa ação não pode ser desfeita.`);
    if (!shouldDelete) return;

    setBusyList(true);

    try {
      const itemsSnapshot = await getDocs(collection(db, 'shoppingLists', list.id, 'items'));
      await Promise.all(itemsSnapshot.docs.map((snapshotDoc) => deleteDoc(snapshotDoc.ref)));
      await deleteDoc(doc(db, 'shoppingLists', list.id));

      toast({
        title: 'Lista excluída',
        description: 'A lista e os itens dela foram removidos.',
      });
      router.push('/lista-de-compras');
    } catch (deleteError) {
      console.error('Error deleting shopping list:', deleteError);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setBusyList(false);
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    if (!list) return;

    const nextChecked = !item.checked;
    const previousItems = items;

    setBusyItemId(item.id);
    setItems((currentItems) =>
      sortItems(
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                checked: nextChecked,
                updatedAt: { toMillis: () => Date.now() },
              }
            : currentItem,
        ),
      ),
    );

    try {
      await updateDoc(doc(db, 'shoppingLists', list.id, 'items', item.id), {
        checked: nextChecked,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'shoppingLists', list.id), {
        pendingItemCount: Math.max(
          0,
          (list.pendingItemCount ?? pendingItems.length) + (item.checked ? 1 : -1),
        ),
        updatedAt: serverTimestamp(),
      });
    } catch (toggleError) {
      console.error('Error toggling shopping list item:', toggleError);
      setItems(previousItems);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o item agora.',
        variant: 'destructive',
      });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    if (!list) return;

    setBusyItemId(item.id);

    try {
      await deleteDoc(doc(db, 'shoppingLists', list.id, 'items', item.id));

      await updateDoc(doc(db, 'shoppingLists', list.id), {
        itemCount: Math.max(0, (list.itemCount ?? items.length) - 1),
        pendingItemCount: Math.max(
          0,
          (list.pendingItemCount ?? pendingItems.length) - (item.checked ? 0 : 1),
        ),
        updatedAt: serverTimestamp(),
      });
    } catch (deleteError) {
      console.error('Error deleting shopping list item:', deleteError);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item agora.',
        variant: 'destructive',
      });
    } finally {
      setBusyItemId(null);
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
              <h1 className="mb-3 text-2xl font-semibold text-gray-800">Faça login para ver suas listas</h1>
              <p className="mx-auto mb-8 max-w-xl text-gray-600">
                Suas listas de compras ficam salvas na conta para você acessar quando quiser.
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
    <div className="min-h-screen py-12">
      <main className="container mx-auto max-w-4xl px-0">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/lista-de-compras"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-secondary no-underline hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para listas
            </Link>
            <h1 className="text-3xl font-bold text-secondary">{loadingList ? 'Carregando...' : list?.name || 'Lista de compras'}</h1>
            {!loadingList && list && (
              <p className="mt-2 text-gray-600">
                {pendingItems.length} pendentes, {completedItems.length} concluídos.
              </p>
            )}
          </div>

          {list && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openRenameListDialog} className="border-secondary text-secondary hover:bg-secondary/10">
                <Pencil className="h-4 w-4" />
                Renomear
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeleteList}
                disabled={busyList}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}
        </div>

        {loadingList ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <p className="text-center font-medium text-gray-600">Carregando lista...</p>
          </Card>
        ) : error ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="font-medium text-red-600">{error}</p>
            </div>
          </Card>
        ) : list ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-4 shadow-sm">
            {loadingItems ? (
              <p className="text-center font-medium text-gray-500">Carregando itens...</p>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-tertiary/40 p-6 text-center">
                <Package2 className="mx-auto mb-4 h-10 w-10 text-tertiary" />
                <h2 className="mb-2 text-lg font-semibold text-gray-800">Sua lista está vazia</h2>
                <p className="text-gray-500">Comece adicionando itens manualmente. Depois a gente integra com receitas.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Pendentes</h2>
                  <div className="space-y-2">
                    {pendingItems.length === 0 ? (
                      <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">Nenhum item pendente no momento.</p>
                    ) : (
                      pendingItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-tertiary/20 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item)}
                            disabled={busyItemId === item.id}
                            className="rounded-full text-secondary transition-colors hover:text-secondary/80"
                            aria-label={`Marcar ${item.name} como comprado`}
                          >
                            <Circle className="h-5 w-5" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.quantityText && <p className="text-sm text-gray-500">{item.quantityText}</p>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item)}
                            disabled={busyItemId === item.id}
                            className="text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Concluídos</h2>
                  <div className="space-y-2">
                    {completedItems.length === 0 ? (
                      <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">Os itens comprados aparecerão aqui.</p>
                    ) : (
                      completedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-tertiary/20 bg-gray-50 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item)}
                            disabled={busyItemId === item.id}
                            className="rounded-full text-green-600 transition-colors hover:text-green-700"
                            aria-label={`Desmarcar ${item.name}`}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-500 line-through">{item.name}</p>
                            {item.quantityText && <p className="text-sm text-gray-400">{item.quantityText}</p>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item)}
                            disabled={busyItemId === item.id}
                            className="text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-6">
              <Button
                onClick={() => router.push(`/lista-de-compras/${list.id}/adicionar`)}
                className="w-full bg-secondary text-white hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                Adicionar itens
              </Button>
            </div>
          </Card>
        ) : null}

        <Modal isOpen={listDialogOpen} onClose={() => setListDialogOpen(false)}>
          <div className="mx-auto w-full max-w-md text-left">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Renomear lista</h2>
              <p className="mt-1 text-sm text-gray-500">Atualize o nome da lista para deixar tudo mais claro.</p>
            </div>

            <div className="space-y-4">
              <Input
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="Ex: Feira da semana"
                disabled={savingList}
              />
              <Button onClick={handleSaveList} disabled={savingList} className="w-full bg-secondary text-white hover:bg-secondary/90">
                {savingList ? 'Salvando...' : 'Salvar nome'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}