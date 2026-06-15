'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  ShoppingCart,
  ChefHat,
  Plus,
  ListChecks,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Modal from '../components/Modal/Modal';
import { trackPageVisit } from '../lib/analytics';
import { db } from '../hooks/userAuth';
import { useUserStore } from '../store/user';
import { useToast } from '../hooks/use-toast';
import { ShoppingList, sortLists } from './shared';

export default function ListaDeComprasPage() {
  const { user } = useUserStore();
  const { toast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [savingList, setSavingList] = useState(false);

  useEffect(() => {
    trackPageVisit('shopping-list');
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setLists([]);
      setLoadingLists(false);
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
      },
      (error) => {
        console.error('Error loading shopping lists:', error);
        setLoadingLists(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas listas de compras.',
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [toast, user?.uid]);

  const openCreateListDialog = () => {
    setListName('');
    setListDialogOpen(true);
  };

  const handleSaveList = async () => {
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
      await addDoc(collection(db, 'shoppingLists'), {
        userId: user.uid,
        name: trimmedName,
        status: 'active',
        itemCount: 0,
        pendingItemCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Lista criada',
        description: 'Sua nova lista de compras está pronta.',
      });

      setListDialogOpen(false);
      setListName('');
    } catch (error) {
      console.error('Error saving shopping list:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingList(false);
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
      <main className="container mx-auto max-w-6xl px-0">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-secondary" />
                <h1 className="text-3xl font-bold text-secondary">Lista de Compras</h1>
              </div>
              <p className="max-w-2xl text-gray-600">
                Crie listas, adicione itens manualmente e acompanhe o que ainda falta comprar.
              </p>
            </div>
          </div>
          <Button onClick={openCreateListDialog} className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/90">
            <Plus className="h-4 w-4" />
            Nova lista
          </Button>
        </div>

        {loadingLists ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="font-medium text-gray-600">Carregando suas listas...</p>
            </div>
          </Card>
        ) : lists.length === 0 ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-tertiary/40 bg-primary">
                <ShoppingCart className="h-10 w-10 text-tertiary" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-gray-800">
                Crie sua primeira lista
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-gray-600">
                Organize compras por ocasião, mercado da semana ou do jeito que fizer mais sentido para você.
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={openCreateListDialog} className="bg-secondary text-white hover:bg-secondary/90">
                  <Plus className="h-4 w-4" />
                  Criar lista
                </Button>
                <Link
                  href="/recipe"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary px-6 py-3 font-medium text-secondary no-underline transition-colors hover:bg-secondary hover:text-white"
                >
                  <ChefHat className="h-4 w-4" />
                  Criar receita
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lista-de-compras/${list.id}`}
                className="no-underline"
              >
                <Card className="h-full rounded-2xl border border-tertiary/30 bg-white p-4 shadow-sm transition-all duration-300 hover:border-secondary/40 hover:shadow-md">
                  <div className="flex h-full flex-col">
                    <div className="mb-4 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-tertiary" />
                      <h2 className="truncate text-lg font-semibold text-gray-800">{list.name}</h2>
                    </div>
                    <p className="mb-6 text-sm text-gray-500">
                      {(list.pendingItemCount ?? 0)} pendentes de {(list.itemCount ?? 0)} itens
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-secondary">
                      <span className="font-medium">Abrir lista</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Modal isOpen={listDialogOpen} onClose={() => setListDialogOpen(false)}>
          <div className="mx-auto w-full max-w-md text-left">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Criar nova lista
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Dê um nome para organizar melhor suas compras.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="Ex: Feira da semana"
                disabled={savingList}
              />
              <Button onClick={handleSaveList} disabled={savingList} className="w-full bg-secondary text-white hover:bg-secondary/90">
                {savingList ? 'Salvando...' : 'Criar lista'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}