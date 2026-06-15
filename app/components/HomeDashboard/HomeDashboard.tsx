'use client';

import Link from 'next/link';
import { ArrowRight, CalendarRange, ChefHat, Crown, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useEffect } from 'react';
import { trackPageVisit } from '../../lib/analytics';
import { useUserStore } from '../../store/user';
import { Card } from '../../ui/card';
import RecentRecipesWidget from './RecentRecipesWidget';
import ShoppingListsWidget from './ShoppingListsWidget';

export default function HomeDashboard() {
  const { user } = useUserStore();

  useEffect(() => {
    trackPageVisit('dashboard-home');
  }, []);

  const recipeCount = user?.plan?.recipeCount;
  const firstName = user?.name?.split(' ')[0] || 'Chefe';

  return (
    <div className="min-h-screen bg-primary/40 py-2 sm:py-4">
      <main className="container mx-auto max-w-6xl px-0">
        <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-secondary">
            <LayoutDashboard className="h-4 w-4" />
            Seu painel
          </div>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Bom te ver, {firstName}</h1>
          <p className="max-w-2xl text-gray-600">
            Use o painel para criar receitas, retomar o que importa e descobrir os próximos recursos do Chefinho IA.
          </p>
        </div>

        <Card className="relative mb-4 min-w-0 overflow-hidden rounded-3xl border border-[#d8c7aa] bg-[linear-gradient(135deg,_#fffdf9_0%,_#f8efe1_100%)] p-4 shadow-sm lg:mb-6 lg:p-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-white/70 blur-2xl sm:h-32 sm:w-32" />
            <div className="absolute bottom-0 left-0 h-24 w-36 bg-gradient-to-tr from-[#caa26a]/10 to-transparent blur-2xl" />
            <div className="absolute right-10 top-8 h-20 w-20 rounded-full border border-white/60 bg-white/25" />
          </div>
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#caa26a]/20 bg-white/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#8a6331] backdrop-blur-sm">
                <ShoppingCart className="h-3.5 w-3.5" />
                ✨ Ouvimos seu feedback
              </div>
              <h2 className="text-xl font-bold leading-tight text-[#47311a] sm:text-2xl">
                Agora você já pode planejar as refeições da semana
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5840] sm:text-base">
                Organize o que vai cozinhar de segunda a domingo e transforme suas receitas em uma lista de compras prática para a semana inteira.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <Link
                href="/planejamento"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5f4529] px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#503a22] sm:w-auto"
              >
                Planejar minha semana
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lista-de-compras"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#caa26a]/20 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#5f4529] no-underline backdrop-blur-sm transition-colors hover:bg-white/80 sm:w-auto"
              >
                Ver minhas listas
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:gap-6">
          <Card className="relative min-w-0 overflow-hidden rounded-3xl border border-secondary/10 bg-gradient-to-br from-secondary via-secondary to-tertiary p-4 text-white shadow-lg sm:p-5">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/15 blur-2xl sm:h-40 sm:w-40" />
              <div className="absolute bottom-0 left-0 h-32 w-40 bg-gradient-to-tr from-black/20 to-transparent blur-2xl sm:h-40 sm:w-52" />
              <div className="absolute right-8 top-8 h-24 w-24 rounded-[28px] border border-white/15 bg-white/5 rotate-12 backdrop-blur-sm" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between gap-4 sm:gap-6">
              <div>
                <h2 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                  O que vamos cozinhar hoje?
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                  Gere uma nova receita com IA em poucos segundos usando os ingredientes que você já tem em casa.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/recipe"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-secondary no-underline transition-colors hover:bg-white/90 sm:w-auto"
                >
                  <ChefHat className="h-4 w-4" />
                  Criar receita
                </Link>
                <Link
                  href="/minhas-receitas"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-white/10 sm:w-auto"
                >
                  Ver minhas receitas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6">
            <Card className="min-w-0 rounded-2xl border border-tertiary/30 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800">Receitas restantes</h2>
                  <p className="text-sm text-gray-500">Seu saldo atual no plano.</p>
                </div>
                <Crown className="h-5 w-5 shrink-0 text-secondary" />
              </div>
              <div className="mb-3 rounded-2xl bg-primary/60 p-3.5">
                <p className="text-3xl font-bold text-secondary">{typeof recipeCount === 'number' ? recipeCount : '--'}</p>
                <p className="mt-1 text-sm text-gray-600">receitas disponíveis agora</p>
              </div>
              <Link
                href="/plans"
                className="inline-flex w-full items-center justify-between gap-2 text-sm font-semibold text-secondary no-underline hover:underline sm:w-auto sm:justify-start"
              >
                Ver plano
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="min-w-0 rounded-2xl border border-tertiary/30 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800">Descobrir recursos</h2>
                  <p className="text-sm text-gray-500">Use o que já existe e prepare o que vem depois.</p>
                </div>
                <CalendarRange className="h-5 w-5 shrink-0 text-secondary" />
              </div>
              <div className="space-y-2.5">
                <Link
                  href="/lista-de-compras"
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 px-3.5 py-3.5 text-gray-800 no-underline transition-colors hover:border-secondary/40 hover:bg-secondary/5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">Lista de compras</p>
                    <p className="mt-1 text-sm text-gray-500">Transforme receitas em ações práticas.</p>
                  </div>
                  <ShoppingCart className="mt-1 h-4 w-4 shrink-0 text-secondary" />
                </Link>
                <Link
                  href="/planejamento"
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 px-3.5 py-3.5 text-gray-800 no-underline transition-colors hover:border-secondary/40 hover:bg-secondary/5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">Planejamento semanal</p>
                    <p className="mt-1 text-sm text-gray-500">Organize as refeicoes da semana e gere sua lista.</p>
                  </div>
                  <CalendarRange className="mt-1 h-4 w-4 shrink-0 text-secondary" />
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
          <RecentRecipesWidget />
          <ShoppingListsWidget />
        </div>
      </main>
    </div>
  );
}
