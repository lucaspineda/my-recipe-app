'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowRight, ListChecks, ShoppingCart } from 'lucide-react';
import { db } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { Card } from '../../ui/card';
import { ShoppingList, sortLists } from '../../lista-de-compras/shared';

export default function ShoppingListsWidget() {
  const { user } = useUserStore();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
        ).slice(0, 3);

        setLists(nextLists);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading dashboard shopping lists:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <Card className="relative min-w-0 overflow-hidden rounded-2xl border border-tertiary/30 bg-[radial-gradient(circle_at_top_left,_rgba(94,163,132,0.18),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(244,251,247,0.95)_100%)] p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
        <div className="absolute bottom-3 right-4 h-16 w-20 rounded-[24px] border border-emerald-200/30 bg-white/30 -rotate-12" />
      </div>
      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800">Lista de compras</h2>
          <p className="text-sm text-gray-500">Acompanhe o que falta e entre mais rápido no mercado.</p>
        </div>
        <ShoppingCart className="h-5 w-5 shrink-0 text-secondary" />
      </div>

      {loading ? (
        <div className="relative z-10 space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3.5" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="relative z-10 rounded-xl border border-dashed border-tertiary/30 bg-white/55 px-3.5 py-6 text-center backdrop-blur-sm">
          <p className="font-medium text-gray-700">Nenhuma lista criada ainda.</p>
          <p className="mt-1 text-sm text-gray-500">Organize compras da semana, da receita ou da feira.</p>
          <Link
            href="/lista-de-compras"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-secondary/90 sm:w-auto"
          >
            <ShoppingCart className="h-4 w-4" />
            Criar lista
          </Link>
        </div>
      ) : (
        <div className="relative z-10 space-y-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lista-de-compras/${list.id}`}
              className="block rounded-xl border border-white/70 bg-white/75 px-3.5 py-3.5 no-underline backdrop-blur-sm transition-colors hover:border-secondary/40 hover:bg-white/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">{list.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {list.pendingItemCount ?? 0} pendentes de {list.itemCount ?? 0} itens
                  </p>
                </div>
                <ListChecks className="mt-1 h-4 w-4 shrink-0 text-secondary" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/lista-de-compras"
        className="relative z-10 mt-3 inline-flex w-full items-center justify-between gap-2 text-sm font-semibold text-secondary no-underline hover:underline sm:w-auto sm:justify-start"
      >
        Ver todas as listas
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
