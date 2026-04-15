import React, { useState, MouseEvent, useEffect, useRef } from 'react';
import { forwardRef } from 'react';
import { useRecipeStore } from '../../store/recipe';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '../Loading/Loading';
import Button from '../Button/Button';
import { auth, db } from '../../hooks/userAuth';
import { getIdToken } from 'firebase/auth';
import { AlertCircle, Clock, Sun, Coffee, Cake, Moon, Cookie, ChefHat } from 'lucide-react';
import { useUserStore } from '../../store/user';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mealOptions } from './data';
import IngredientsInput from '../IngredientsInput/IngredientsInput';
import SingleSelect from '../SingleSelect/SingleSelect';
import Modal from '../Modal/Modal';
import { Slider } from '../../ui/slider';
import { generateRecipeImage } from '../../lib/utils';
import { trackEvent } from '../../lib/analytics';
import RecipeLimitModal from '../SurveyReward/RecipeLimitModal';
import SurveyRewardModal from '../SurveyReward/SurveyRewardModal';

const schema = z.object({
  ingredients: z.string(),
  mealType: z.string().min(1, 'Selecione o tipo de refeição'),
});

export const MealForm = forwardRef<HTMLFormElement>(({}, ref) => {
  const {
    recipeLoading,
    updateIngredients,
    updateMealOption,
    setRecipeLoading,
  } = useRecipeStore();

  const [error, setError] = useState(false);
  const [optionMeal, setOptionMeal] = useState('almoco');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientMode, setIngredientMode] = useState<'strict' | 'suggest'>('suggest');
  const [prepTime, setPrepTime] = useState(40);
  const [cookingLevel, setCookingLevel] = useState<'iniciante' | 'intermediario' | 'avancado'>('intermediario');
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showRecipeLimitModal, setShowRecipeLimitModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const ingredientsInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, updateRecipesCount } = useUserStore();

  const notify = () => toast.error('Ocorreu um erro ao gerar a receita');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        notify();
      }, 100);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    const savedIngredients = localStorage.getItem('ingredients');
    if (savedIngredients && pathname === '/recipe') {
      const parsedIngredients = JSON.parse(savedIngredients);
      setIngredients(parsedIngredients);
      setValue('ingredients', parsedIngredients.length > 0 ? parsedIngredients.join(', ') : '');
      localStorage.removeItem('ingredients');
    }
    
    // Retrieve other saved options
    if (pathname === '/recipe') {
      const savedIngredientMode = localStorage.getItem('ingredientMode');
      const savedPrepTime = localStorage.getItem('prepTime');
      const savedCookingLevel = localStorage.getItem('cookingLevel');
      const savedMealType = localStorage.getItem('mealType');
      
      if (savedIngredientMode) {
        setIngredientMode(savedIngredientMode as 'strict' | 'suggest');
        localStorage.removeItem('ingredientMode');
      }
      if (savedPrepTime) {
        setPrepTime(parseInt(savedPrepTime));
        localStorage.removeItem('prepTime');
      }
      if (savedCookingLevel) {
        setCookingLevel(savedCookingLevel as 'iniciante' | 'intermediario' | 'avancado');
        localStorage.removeItem('cookingLevel');
      }
      if (savedMealType) {
        setOptionMeal(savedMealType);
        setValue('mealType', savedMealType);
        localStorage.removeItem('mealType');
      }
    }
    
    // Set default mealType value
    setValue('mealType', optionMeal);
  }, [pathname, setValue, optionMeal]);

  const handleIngredientsChange = (newIngredients: string[]) => {
    setIngredients(newIngredients);
    setValue('ingredients', newIngredients.length > 0 ? newIngredients.join(', ') : '');
    if (pathname === '/') {
      localStorage.setItem('ingredients', JSON.stringify(newIngredients));
    }
  };

  const saveRecipe = async (recipe: any, imageUrl?: string) => {
    console.log('Saving recipe:', recipe);
    try {
      const savedRecipe = await addDoc(collection(db, 'recipes'), {
        title: recipe.titulo,
        introduction: recipe.introducao,
        ingredients: recipe.ingredientes,
        preparationMethod: recipe.modoDePreparo,
        observations: recipe.observacoes,
        nutritionalInfo: recipe.informacoesNutricionais || null,
        imageUrl: imageUrl || null,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return savedRecipe;
    } catch (error) {
      console.error('Error saving recipe: ', error);
      toast.error('Erro ao salvar a receita. Tente novamente.');
    }
  };

  const handleGetRecipe = async (e: MouseEvent<HTMLButtonElement>) => {
    // Check if ingredients are empty
    if (ingredients.length === 0) {
      setShowIngredientsModal(true);
      return;
    }

    if (!auth.currentUser) {
      updateIngredients(ingredients.join(', '));
      updateMealOption(optionMeal);
      
      // Save all form options to localStorage
      localStorage.setItem('ingredientMode', ingredientMode);
      localStorage.setItem('prepTime', prepTime.toString());
      localStorage.setItem('cookingLevel', cookingLevel);
      localStorage.setItem('mealType', optionMeal);
      
      router.push('/signup');
      return;
    }

    const token = await getIdToken(auth.currentUser);

    if (!token) {
      return console.log('unauthorized');
    }


    await generateRecipe(token);
    trackEvent('generate_recipes');
  };

  const generateRecipe = async (token?: string) => {
    if (!token) {
      token = await getIdToken(auth.currentUser);
    }
    if (!token) return;

    setRecipeLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini/`,
        {
          optionMeal: optionMeal,
          ingredients: ingredients.join(', '),
          ingredientMode: ingredientMode,
          prepTime: prepTime,
          cookingLevel: cookingLevel,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        },
      );

      const selectedRecipe = response.data.response;

      if (!selectedRecipe) {
        throw new Error('No recipe returned from single recipe endpoint');
      }

      const savedRecipe = await saveRecipe(selectedRecipe);
      if (!savedRecipe) {
        throw new Error('Failed to save generated recipe');
      }

      const newRecipeCount = user.plan.recipeCount - 1;

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'plan.recipeCount': newRecipeCount,
      });
      updateRecipesCount(newRecipeCount);

      router.push(`/recipe/${savedRecipe.id}`);

      const isPro = user?.plan?.planId >= 2;
      if (isPro) {
        generateRecipeImage(savedRecipe.id, selectedRecipe);
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      setError(true);
    } finally {
      setRecipeLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleGetRecipe)}
        className="w-full flex flex-col text-left max-w-[720px]"
        ref={ref}
      >
          {user && user?.plan?.planId !== 3 && (
            <div className="flex items-center gap-3 mb-6 bg-primary px-4 py-3 rounded-lg border border-tertiary/30">
              <span className="text-2xl">{user.plan.recipeCount === 0 ? '😢' : '🎉'}</span>
              <p className="text-sm font-semibold text-gray-800 flex-1">
                {user.plan.recipeCount === 0
                  ? 'Você não possui receitas disponíveis'
                  : `Você possui ${user.plan.recipeCount} receita${user.plan.recipeCount !== 1 ? 's' : ''} disponíve${user.plan.recipeCount !== 1 ? 'is' : 'l'}`
                }
              </p>
              {user.plan.recipeCount === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('recipe_limit_modal_opened', { source: 'meal_form_banner' });
                    setShowRecipeLimitModal(true);
                  }}
                  className="text-xs font-semibold text-secondary bg-white border border-secondary/30 px-3 py-1.5 rounded-lg hover:bg-secondary hover:text-white transition-colors whitespace-nowrap"
                >
                  Ganhe mais receitas
                </button>
              )}
            </div>
          )}

          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">1</div>
          <label className="secondary-header py-3">Liste os ingredientes que você possuí em casa</label>
          <IngredientsInput
            selectedIngredients={ingredients}
            onIngredientsChange={handleIngredientsChange}
            placeholder="Digite um ingrediente..."
            className="mb-4"
            ref={ingredientsInputRef}
          />
          
          {/* Ingredient Mode Toggle */}
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-6">2</div>
          <label className="secondary-header py-3">Como usar os ingredientes</label>
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIngredientMode('suggest')}
                className={`flex-1 py-4 px-4 rounded-lg border-2 transition-all ${
                  ingredientMode === 'suggest'
                    ? 'bg-white border-secondary shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                <div className="text-lg mb-1">✨ Modo criativo</div>
                <p className="text-sm text-gray-500">Usa a maioria dos ingredientes mas pode sugerir remoção ou adição</p>
              </button>
              <button
                type="button"
                onClick={() => setIngredientMode('strict')}
                className={`flex-1 py-4 px-4 rounded-lg border-2 transition-all ${
                  ingredientMode === 'strict'
                    ? 'bg-white border-secondary shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                <div className="text-lg mb-1">🍳 Só o que eu tenho</div>
                <p className="text-sm text-gray-500">Usa apenas os ingredientes que você listou</p>
              </button>
            </div>
          </div>

          {/* Prep Time Slider */}
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-6">3</div>
          <label className="secondary-header py-3">Tempo de preparo</label>
          <div className="mb-4">
            <div className="flex items-center justify-end mb-3">
              <span className="text-base font-semibold text-secondary">
                {prepTime === 0 ? 'Sem limite' : `${prepTime} min`}
              </span>
            </div>
            <Slider
              value={[prepTime]}
              onValueChange={(value) => setPrepTime(value[0])}
              max={90}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-800 mt-1">
              <span>Sem limite</span>
              <span>90 min</span>
            </div>
          </div>

          {/* Cooking Level */}
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-6">4</div>
          <label className="secondary-header py-3">Qual seu nível na cozinha?</label>
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCookingLevel('iniciante')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  cookingLevel === 'iniciante'
                    ? 'bg-white border-secondary shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                <div className="text-lg">🍳 Iniciante</div>
              </button>
              <button
                type="button"
                onClick={() => setCookingLevel('intermediario')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  cookingLevel === 'intermediario'
                    ? 'bg-white border-secondary shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                <div className="text-lg">🥩 Intermediário</div>
              </button>
              <button
                type="button"
                onClick={() => setCookingLevel('avancado')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  cookingLevel === 'avancado'
                    ? 'bg-white border-secondary shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                <div className="text-lg">🧑‍🍳 Avançado</div>
              </button>
            </div>
          </div>

          {errors?.ingredients?.message && (
            <span className="text-red-700 text-sm mt-2">{errors?.ingredients?.message.toString()}</span>
          )}
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-6">5</div>
          <label className="secondary-header py-3">Selecione qual refeição irá preparar</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setOptionMeal('cafe');
                setValue('mealType', 'cafe');
              }}
              className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition-all ${
                optionMeal === 'cafe'
                  ? 'bg-white border-secondary shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              <span className="text-2xl mb-2">☕</span>
              <span className="text-sm font-medium">Café da Manhã</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionMeal('almoco');
                setValue('mealType', 'almoco');
              }}
              className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition-all ${
                optionMeal === 'almoco'
                  ? 'bg-white border-secondary shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              <span className="text-2xl mb-2">🍽️</span>
              <span className="text-sm font-medium">Almoço</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionMeal('lanche');
                setValue('mealType', 'lanche');
              }}
              className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition-all ${
                optionMeal === 'lanche'
                  ? 'bg-white border-secondary shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              <span className="text-2xl mb-2">🥪</span>
              <span className="text-sm font-medium">Lanche</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionMeal('janta');
                setValue('mealType', 'janta');
              }}
              className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition-all ${
                optionMeal === 'janta'
                  ? 'bg-white border-secondary shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              <span className="text-2xl mb-2">🌙</span>
              <span className="text-sm font-medium">Janta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionMeal('sobremesa');
                setValue('mealType', 'sobremesa');
              }}
              className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition-all ${
                optionMeal === 'sobremesa'
                  ? 'bg-white border-secondary shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              <span className="text-2xl mb-2">🍰</span>
              <span className="text-sm font-medium">Sobremesa</span>
            </button>
          </div>
          {errors?.mealType?.message && (
            <span className="text-red-700 text-sm mt-2">{errors?.mealType?.message.toString()}</span>
          )}
          {user?.plan.planId !== 3 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                {user?.plan.recipeCount < 3 && user?.plan.recipeCount > 0 && (
                  <>
                    <AlertCircle
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="Hello world!"
                      color="#f6e8d3"
                      fill="black"
                      size={42}
                    />
                    <p>
                      Você ainda pode gerar {user.plan.recipeCount} receitas. Faça um{' '}
                      <Link className="text-black" href="/plans">
                        upgrade
                      </Link>{' '}
                      para continuar usando.
                    </p>
                  </>
                )}
                {user?.plan.recipeCount === 0 && (
                  <>
                    <AlertCircle
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="Hello world!"
                      color="#f6e8d3"
                      fill="black"
                      size={42}
                    />
                    <p>Você atingiu o limite de receitas. Escolha um plano para continuar usando.</p>
                  </>
                )}
              </div>
            </>
          )}
          {user?.plan.recipeCount === 0 ? (
            <button
              type="button"
              className="mb-20 flex justify-center gap-2 bg-secondary w-full py-4 text-white rounded-lg border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1)] font-semibold cursor-pointer"
              onClick={() => {
                trackEvent('recipe_limit_modal_opened', { source: 'meal_form' });
                setShowRecipeLimitModal(true);
              }}
            >
              Gerar Receita
            </button>
          ) : (
            <Button className="mb-20">Gerar Receita</Button>
          )}

          {/* Hidden input para react-hook-form */}
          <input {...register('ingredients')} type="hidden" value={ingredients.join(', ')} />
          <input {...register('mealType')} type="hidden" value={optionMeal} />
      </form>

      {/* Ingredients Required Modal */}
      <Modal isOpen={showIngredientsModal} onClose={() => setShowIngredientsModal(false)}>
        <div className="max-w-md">
          <h3 className="text-xl font-bold mb-4">Ingredientes Necessários</h3>
          <p className="text-gray-700 mb-6">
            Para gerar sua receita personalizada, você precisa adicionar pelo menos um ingrediente. 
            Digite os ingredientes que você tem disponível em casa.
          </p>
          <Button onClick={() => {
            setShowIngredientsModal(false);
            setTimeout(() => ingredientsInputRef.current?.focus(), 100);
          }}>
            Entendi
          </Button>
        </div>
      </Modal>

      <Modal isOpen={recipeLoading} onClose={() => {}}>
        <Loading
          compact
          title="Aguarde enquanto criamos sua receita"
          subtitle="Estamos preparando uma receita personalizada com base nos ingredientes e preferências que você escolheu."
        />
      </Modal>

      <RecipeLimitModal
        isOpen={showRecipeLimitModal}
        surveyAlreadyCompleted={!!user?.surveyCompletedAt}
        onClose={() => {
          trackEvent('recipe_limit_dismissed');
          setShowRecipeLimitModal(false);
        }}
        onStartSurvey={() => {
          setShowRecipeLimitModal(false);
          setShowSurveyModal(true);
        }}
        onUpgrade={() => {
          setShowRecipeLimitModal(false);
          router.push('/plans');
        }}
      />

      <SurveyRewardModal
        isOpen={showSurveyModal}
        onClose={() => {
          trackEvent('survey_dismissed');
          setShowSurveyModal(false);
        }}
        onComplete={() => {
          setShowSurveyModal(false);
          toast.success('Pronto! +5 receitas adicionadas 🎉');
        }}
      />
    </>
  );
});

MealForm.displayName = 'MealForm';

export default MealForm;
