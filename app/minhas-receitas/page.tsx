'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../hooks/userAuth';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { Card } from '../components/RecipeView/ui/card';

interface Recipe {
  id: string;
  title: string;
  introduction: string;
}

export default function MinhasReceitas() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  useEffect(() => {
    const fetchRecipes = async () => {
      try {

        const recipesRef = collection(db, 'recipes');
        const q = query(recipesRef);
        const querySnapshot = await getDocs(q);

        console.log(querySnapshot, 'querySnapshot docs');
        
        const fetchedRecipes: Recipe[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.data().userId === auth.currentUser?.uid) {
            fetchedRecipes.push({
              id: doc.id,
              title: doc.data().title,
              introduction: doc.data().introduction
            });
          }
        });

        // Ordenar por título
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
  }, [auth.currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <main className="container flex flex-col">
          <div className="flex flex-col items-center mt-8 text-center">
            <p>Carregando suas receitas...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center">
        <main className="container flex flex-col">
          <div className="flex flex-col items-center mt-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <main className="container flex flex-col">
        <div className="flex flex-col items-center mt-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Minhas Receitas</h1>
          <p className="text-gray-600">Aqui você encontrará todas as suas receitas salvas</p>
        </div>
        <section className="flex flex-col gap-4 mt-8">
          {recipes.length === 0 ? (
            <div className="bg-white rounded-md py-8 px-8 text-center">
              <p className="text-gray-600">Você ainda não tem receitas salvas.</p>
              <p className="text-gray-600 mt-2">Crie uma receita e salve para vê-la aqui!</p>
            </div>
          ) : (
            recipes.map((recipe) => (
              <Link href={`/recipe/${recipe.id}`} key={recipe.id}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h2 className="text-lg font-semibold mb-2">{recipe.title}</h2>
                  <p className="text-gray-600 line-clamp-2">{recipe.introduction}</p>
                </Card>
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  );
}