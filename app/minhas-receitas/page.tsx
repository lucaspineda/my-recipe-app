'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../hooks/userAuth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { Card } from '../components/RecipeView/ui/card';
import { ChefHat, Clock, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRecipeStore } from '../store/recipe';

interface Recipe {
  id: string;
  title: string;
  introduction: string;
  createdAt?: any;
  ingredients?: any[];
  preparationMethod?: string[];
  userId: string;
}

export default function MinhasReceitas() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const { setShowRecipe, recipe } = useRecipeStore();

  const handleRedirect = async () => {
    setShowRecipe(false)
  }
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!currentUser) {
        setError('Você precisa estar logado para ver suas receitas');
        setLoading(false);
        return;
      }

      try {
        const recipesRef = collection(db, 'recipes');
        const q = query(recipesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        const fetchedRecipes: Recipe[] = [];
        querySnapshot.forEach((doc) => {
          const recipeData = doc.data();
          fetchedRecipes.push({
            id: doc.id,
            title: recipeData.title,
            introduction: recipeData.introduction,
            createdAt: recipeData.createdAt,
            ingredients: recipeData.ingredients || [],
            preparationMethod: recipeData.preparationMethod || [],
            userId: recipeData.userId
          });
        });

        fetchedRecipes.sort((a, b) => a.title.localeCompare(b.title));
        setRecipes(fetchedRecipes);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError('Erro ao carregar receitas');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-tertiary mx-auto animate-bounce" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">
            Preparando suas receitas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 rounded-xl shadow-lg border border-tertiary/50 bg-white">
          <div className="text-red-500 mb-4">
            <ChefHat className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <ChefHat className="w-6 h-6 text-secondary" />
            <h1 className="text-2xl font-bold text-secondary">Minhas Receitas</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore sua coleção pessoal de receitas deliciosas. Cada uma delas foi criada especialmente
            para tornar seus momentos na cozinha ainda mais especiais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.length === 0 ? (
            <div className="col-span-full">
              <div className="rounded-2xl p-12 text-center shadow-sm border border-tertiary/50 bg-white">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-tertiary">
                  <ChefHat className="w-10 h-10 text-tertiary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma receita ainda</h3>
                <p className="text-gray-500">
                  Que tal criar sua primeira receita deliciosa?
                </p>
              </div>
            </div>
          ) : (
            recipes.map((recipe) => (
              <Link href={`/recipe/${recipe.id}`} key={recipe.id} className="no-underline">
                <Card className="group h-full hover:shadow-xl transition-all duration-300 border border-tertiary/30 hover:border-tertiary overflow-hidden bg-white">
                  <div className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-tertiary transition-colors">
                          {recipe.title}
                        </h2>
                        <p className="text-gray-600 line-clamp-2 mb-6">
                          {recipe.introduction}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <ChefHat className="w-4 h-4 text-tertiary" />
                            <span>{recipe.ingredients?.length || 0} ingredientes</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4 text-tertiary" />
                            <span>{recipe.preparationMethod?.length || 0} passos</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between text-tertiary">
                          <span className="font-medium">Ver receita</span>
                          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/recipe"
            onClick={handleRedirect}
            className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-lg hover:bg-secondary/90 transition-colors shadow-md hover:shadow-lg no-underline"
          >
            <ChefHat className="w-5 h-5" />
            <span className="font-medium">Criar Nova Receita</span>
          </Link>
        </div>
      </main>
    </div>
  );
}