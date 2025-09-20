import { useRecipeStore } from '../../store/recipe';
import { MouseEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '../../hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '../../store/user';
import { auth, db } from '../../hooks/userAuth';
import { useRouter } from 'next/navigation';

import {
  BookmarkPlus,
  Share2,
  Clock,
  Users,
  ChefHat,
  Bookmark,
  Link,
  Facebook,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface RecipeCardProps {
  isSaved?: boolean;
  onSave?: (recipeId: string) => Promise<void>;
  onShare?: (recipeId: string, platform: string) => Promise<void>;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ onSave, onShare, isSaved = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [loadingImg, setLoadingImg] = useState(true);
  const [idRecipeSaved, setIdRecipeSaved] = useState('')
  const router = useRouter();

  const { setShowRecipe, recipe } = useRecipeStore();

  const { toast } = useToast();

  const handleGetOtherRecipe = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setShowRecipe(false);
  };

  // Parse JSON vindo da store
  let newRecipe = recipe.replace(/```json|```/g, '').trim();
  let newRecipeObject = JSON.parse(newRecipe);

  const title = newRecipeObject?.titulo;
  const introduction = newRecipeObject?.introducao;
  const ingredients = newRecipeObject?.ingredientes || [];
  const preparationMethod = newRecipeObject?.modoDePreparo || [];
  const observations = newRecipeObject?.observacoes || [];

  const recipeForSave = { title, introduction, ingredients, preparationMethod, observations };
  const promptImage = `
  Fotografia realista de um prato de comida delicioso chamado "${title}".
  O prato deve conter somente os seguintes ingredientes bem visíveis e bem apresentados:
  ${ingredients.join(", ")}.
  Estilo: fotografia profissional de restaurante, bem iluminada, fundo neutro,
  ângulo de cima (flat lay), alta resolução.
  Não adicionar ingredientes extras além dos listados.
`;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const recipeId = await saveRecipe(recipeForSave);
      setIdRecipeSaved(recipeId);
      setSaved(true); // agora só fica salvo, não alterna
      toast({
        title: 'Receita salva!',
        description: 'A receita foi salva nos seus favoritos.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a receita. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = () => {
    if (!idRecipeSaved) return;
    router.push(`/minhas-receitas`);
  };

  const handleShare = async (platform: string) => {
    try {
      setShareDialogOpen(false);
      if (platform === 'whatsapp') {
        const currentUrl = window.location.href;
        const message = `Veja esta receita que criei no Chefinho IA: ${recipeForSave.title}\n\nPara ver a receita clique no link: ${currentUrl}`;
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

  async function saveRecipe(recipe) {
    const userId = auth.currentUser.uid;
    if (!userId) return;

    const recipeId = await addDoc(collection(db, 'recipes'), {
      title: recipe.title,
      introduction: recipe.introduction,
      ingredients: recipe.ingredients,
      preparationMethod: recipe.preparationMethod,
      observations: recipe.observations,
      userId: userId,
      createdAt: serverTimestamp(),
    });

    console.log('receita salva', recipeId.id);
    setIdRecipeSaved(recipeId.id)
    return recipeId.id;
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-secondary mb-4 flex justify-center">{title}</CardTitle>
              <p className="text-[#5C5C5C] leading-relaxed">{introduction}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center my-6">
            {loadingImg && (
              <div className="flex flex-col items-center">
                <p className="text-gray-600 mb-2">Gerando imagem...</p>
                <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={`https://image.pollinations.ai/prompt/${promptImage}`}
              alt="Imagem da receita"
              className={`w-[400px] rounded-xl shadow-lg transition-opacity duration-500 ${loadingImg ? 'hidden' : 'block'
                }`}
              onLoad={() => setLoadingImg(false)}
            />
          </div>
        </CardContent>

        <CardContent className="space-y-6">
          <Separator />

          {/* Ingredientes */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#F57C00]" />
              Ingredientes:
            </h3>
            <ul className="space-y-2">
              {ingredients.map((ingredient: any, index: number) => (
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
              {preparationMethod.map((step: string, index: number) => (
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
          {observations.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3">Observações:</h3>
                <ul className="space-y-2">
                  {observations.map((obs: string, index: number) => (
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
          <div className="flex flex-col gap-3 pt-2 md:flex-row">
            <Button
              onClick={saved ? handleRedirect : handleSave}
              disabled={isLoading}
              variant={`${saved ? "saved" : "secondary"}`}
              className="flex-1 text-white font-semibold transition-colors"
            >
              {saved ? <Bookmark className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              {saved ? 'Minhas Receitas' : 'Salvar Receita'}
            </Button>
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

            {/* Facebook */}
            {/* <Button
              onClick={() => handleShare("facebook")}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </Button>

            <Button
              onClick={() => handleShare("twitter")}
              className="bg-sky-500 text-white hover:bg-sky-600 flex items-center gap-2"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecipeCard;
