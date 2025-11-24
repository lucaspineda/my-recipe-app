'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../hooks/userAuth';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Separator } from '@radix-ui/react-separator';
import { ChefHat, Share2, Link, MessageCircle } from 'lucide-react';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DialogHeader } from '../../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '../../store/recipe';

declare global {
  interface Window {
    clarity: (type: string, event: string, value?: string) => void;
  }
}

interface Recipe {
  title: string;
  introduction: string;
  ingredients: string[];
  preparationMethod: string[];
  observations: string[];
  userId: string;
  createdAt: any;
}

const RecipePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [recipes, setRecipes] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [chatFeatureDialogOpen, setChatFeatureDialogOpen] = useState(false);
  const { setShowRecipe, recipe } = useRecipeStore();

  const handleShare = async (platform: string) => {
    try {
      setShareDialogOpen(false);
      if (platform === 'whatsapp') {
        const currentUrl = window.location.href;
        const message = `Veja esta receita que criei no Chefinho IA: ${recipes.title}\n\nPara ver a receita clique no link: ${currentUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      if (platform === 'link') {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Link copiado',
          description: 'O link da receita foi copiado para a área de transferência.',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar a receita.',
        variant: 'destructive',
      });
    }
  };

  const handleGetOtherRecipe = async () => {
    try {
      setShowRecipe(false);
      router.push('/recipe');
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível obter outra receita.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeId = params.id as string;
        const recipeRef = doc(db, 'recipes', recipeId);
        const recipeSnap = await getDoc(recipeRef);

        if (recipeSnap.exists()) {
          setRecipes(recipeSnap.data() as Recipe);
        } else {
          setError('Recipe not found');
        }
      } catch (err) {
        setError('Error fetching recipe');
        console.error('Error fetching recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex justify-center">
      <>
        <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-[#2B2B2B] mb-2">{recipes.title}</CardTitle>
                <p className="text-[#5C5C5C] leading-relaxed">{recipes.introduction}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            {/* Ingredientes */}
            <div>
              <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#F57C00]" />
                Ingredientes:
              </h3>
              <ul className="space-y-2">
                {recipes.ingredients.map((ingredient: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#F57C00] rounded-full mt-2 shrink-0" />
                    <span className="text-[#5C5C5C]">
                      {ingredient.nome || ingredient.item} - {ingredient.quantidade}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Modo de preparo */}
            <div>
              <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3">Modo de Preparo:</h3>
              <ol className="space-y-3">
                {recipes.preparationMethod.map((step: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-[#F57C00] text-white rounded-full text-sm font-semibold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-[#5C5C5C] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Observações */}
            {recipes.observations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3">Observações:</h3>
                  <ul className="space-y-2">
                    {recipes.observations.map((obs: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-[#4CAF50] rounded-full mt-2 shrink-0" />
                        <span className="text-[#2E7D32] italic">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            {/* Botões principais */}
            <div className="flex flex-col gap-3 pt-2">
              {/* Seção de ajuda do Chefinho */}
              <div className="bg-secondary/10 border-2 border-secondary/20 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Precisa de ajuda?</strong> Tire dúvidas sobre a receita, saiba quais ingredientes pode substituir ou 
                  como melhorar o prato. O Chefinho está aqui para ajudar!
                </p>
                <Button
                  className="w-full h-auto min-h-[44px] py-3 bg-secondary text-white font-semibold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 text-wrap"
                  onClick={() => {
                    setChatFeatureDialogOpen(true);
                  }}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-tight">Fale com o Chefinho sobre essa receita</span>
                </Button>
              </div>

              {/* Botões de compartilhar e gerar nova receita */}
              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  onClick={() => setShareDialogOpen(true)}
                  className="flex-1 bg-[#F57C00] text-white font-semibold hover:bg-[#E64A19] transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>

                <Button
                  variant="secondary"
                  className="flex-1 text-white font-semibold transition-colors"
                  onClick={handleGetOtherRecipe}
                >
                  Gerar outra receita
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de compartilhar */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Compartilhar Receita</DialogTitle>
              <DialogDescription className="text-black/90">
                Escolha como você deseja compartilhar esta receita deliciosa.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              {/* Copiar link */}
              <Button
                onClick={() => handleShare('link')}
                className="bg-gray-200 text-recipe-brown hover:bg-gray-300 flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Copiar Link
              </Button>

              {/* WhatsApp */}
              <Button
                onClick={() => handleShare('whatsapp')}
                className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de funcionalidade de chat */}
        <Dialog open={chatFeatureDialogOpen} onOpenChange={setChatFeatureDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Funcionalidade em Desenvolvimento</DialogTitle>
              <DialogDescription className="text-black/90">
                Estamos trabalhando nessa funcionalidade para você poder conversar com o Chefinho IA sobre suas receitas!
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-center text-gray-700 mb-6">
                Você pagaria por essa funcionalidade?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setChatFeatureDialogOpen(false);
                    toast({
                      title: 'Obrigado!',
                      description: 'Sua opinião é muito importante para nós. Vamos considerar isso no desenvolvimento.',
                    });
                  }}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Sim
                </Button>
                <Button
                  onClick={() => {
                    setChatFeatureDialogOpen(false);
                    toast({
                      title: 'Obrigado!',
                      description: 'Sua opinião é muito importante para nós.',
                    });
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Não
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
};

export default RecipePage;
