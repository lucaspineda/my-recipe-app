'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { ArrowRight, ChefHat, Clock } from 'lucide-react';
import { db } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { Card } from '../../ui/card';

interface DashboardRecipe {
  id: string;
  title: string;
  introduction: string;
  ingredients?: any[];
  preparationMethod?: string[];
}

export default function RecentRecipesWidget() {
  const { user } = useUserStore();
  const [recipes, setRecipes] = useState<DashboardRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user?.uid) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      try {
        const recipesRef = collection(db, 'recipes');
        const recipesQuery = query(
          recipesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3),
        );
        const querySnapshot = await getDocs(recipesQuery);

        const nextRecipes = querySnapshot.docs.map((snapshotDoc) => {
          const recipeData = snapshotDoc.data();
          return {
            id: snapshotDoc.id,
            title: recipeData.title,
            introduction: recipeData.introduction,
            ingredients: recipeData.ingredients || [],
            preparationMethod: recipeData.preparationMethod || [],
          };
        });

        setRecipes(nextRecipes);
      } catch (error) {
        console.error('Error loading dashboard recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [user?.uid]);

  return (
    <Card className="relative min-w-0 overflow-hidden rounded-2xl border border-tertiary/30 bg-[radial-gradient(circle_at_top_right,_rgba(255,184,107,0.22),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(255,248,240,0.94)_100%)] p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />
        <div className="absolute bottom-2 right-4 h-16 w-16 rounded-2xl border border-secondary/10 bg-white/30 rotate-12" />
      </div>
      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800">Minhas receitas</h2>
          <p className="text-sm text-gray-500">Suas últimas criações, prontas para revisitar.</p>
        </div>
        <ChefHat className="h-5 w-5 shrink-0 text-secondary" />
      </div>

      {loading ? (
        <div className="relative z-10 space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3.5" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="relative z-10 rounded-xl border border-dashed border-tertiary/30 bg-white/55 px-3.5 py-6 text-center backdrop-blur-sm">
          <p className="font-medium text-gray-700">Você ainda não criou receitas.</p>
          <p className="mt-1 text-sm text-gray-500">Comece agora e monte sua coleção.</p>
          <Link
            href="/recipe"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-secondary/90 sm:w-auto"
          >
            <ChefHat className="h-4 w-4" />
            Criar receita
          </Link>
        </div>
      ) : (
        <div className="relative z-10 space-y-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="block rounded-xl border border-white/70 bg-white/75 px-3.5 py-3.5 no-underline backdrop-blur-sm transition-colors hover:border-secondary/40 hover:bg-white/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">{recipe.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{recipe.introduction}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <ChefHat className="h-3.5 w-3.5 text-tertiary" />
                      {recipe.ingredients?.length || 0} ingredientes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-tertiary" />
                      {recipe.preparationMethod?.length || 0} passos
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-secondary" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/minhas-receitas"
        className="relative z-10 mt-3 inline-flex w-full items-center justify-between gap-2 text-sm font-semibold text-secondary no-underline hover:underline sm:w-auto sm:justify-start"
      >
        Ver todas as receitas
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
