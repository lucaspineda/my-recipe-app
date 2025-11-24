import React, { useState, MouseEvent, useEffect } from 'react';
import Image from 'next/image';
import { forwardRef } from 'react';
import { useRecipeStore } from '../../store/recipe';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '../Loading/Loading';
import Button from '../Button/Button';
import { auth, db } from '../../hooks/userAuth';
import { getIdToken } from 'firebase/auth';
import { AlertCircle } from 'lucide-react';
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

const schema = z.object({
  ingredients: z.string(),
  mealType: z.string().min(1, 'Selecione o tipo de refeição'),
});

export const MealForm = forwardRef<HTMLFormElement>(({}, ref) => {
  const {
    recipeLoading,
    showRecipe,
    updateIngredients,
    updateMealOption,
    setRecipeLoading,
  } = useRecipeStore();

  const [error, setError] = useState(false);
  const [optionMeal, setOptionMeal] = useState('almoco');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
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

  const saveRecipe = async (recipe: any) => {
    console.log('Saving recipe:', recipe);
    try {
      const savedRecipe = await addDoc(collection(db, 'recipes'), {
        title: recipe.titulo,
        introduction: recipe.introducao,
        ingredients: recipe.ingredientes,
        preparationMethod: recipe.modoDePreparo,
        observations: recipe.observacoes,
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
      router.push('/signup');
      return;
    }

    const token = await getIdToken(auth.currentUser);

    if (!token) {
      return console.log('unauthorized');
    }

    setRecipeLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini`,
        {
          optionMeal: optionMeal,
          ingredients: ingredients.join(', '),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        },
      );

      const newRecipeCount = user.plan.recipeCount - 1;

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'plan.updatedAt': serverTimestamp(),
        'plan.recipeCount': newRecipeCount,
      });
      updateRecipesCount(newRecipeCount);

      let newRecipe = response.data.response.replace(/```json|```/g, '').trim();
      let newRecipeObject = JSON.parse(newRecipe);
      const recipe = await saveRecipe(newRecipeObject);
      if (recipe) {
        router.push(`/recipe/${recipe.id}`);
      }
    } catch (error) {
      setRecipeLoading(false);
      setError(true);

      return console.log(error);
    } finally {
      setTimeout(() => {
        setRecipeLoading(false);
      }, 500);
    }
  };

  if (recipeLoading) {
    return <Loading />;
  }

  return (
    <>
      {!showRecipe && (
        <form
          onSubmit={handleSubmit(handleGetRecipe)}
          className="w-full flex flex-col text-left max-w-[720px]"
          ref={ref}
        >
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">1</div>
          <label className="secondary-header py-3">Liste os ingredientes que você possuí em casa</label>
          <IngredientsInput
            selectedIngredients={ingredients}
            onIngredientsChange={handleIngredientsChange}
            placeholder="Digite um ingrediente..."
            className="mb-4"
            ref={ingredientsInputRef}
          />
          {errors?.ingredients?.message && (
            <span className="text-red-700 text-sm mt-2">{errors?.ingredients?.message.toString()}</span>
          )}
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">2</div>
          <label className="secondary-header py-3">Selecione qual refeição irá preparar</label>
          <SingleSelect
            options={mealOptions}
            value={optionMeal}
            onChange={(value) => {
              setOptionMeal(value);
              setValue('mealType', value);
            }}
            placeholder="Selecione o tipo de refeição"
            className="mb-4"
          />
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
            <Link
              className="mb-20 flex justify-center gap-2 bg-secondary w-full py-4 text-white rounded-lg border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold no-underline"
              href={'/plans'}
            >
              Escolha um plano
            </Link>
          ) : (
            <Button className="mb-20">Gerar Receita</Button>
          )}

          {/* Hidden input para react-hook-form */}
          <input {...register('ingredients')} type="hidden" value={ingredients.join(', ')} />
          <input {...register('mealType')} type="hidden" value={optionMeal} />
        </form>
      )}

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
    </>
  );
});

MealForm.displayName = 'MealForm';

export default MealForm;
