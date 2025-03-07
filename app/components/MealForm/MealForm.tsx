import React, { ChangeEvent, useState, MouseEvent, useEffect } from "react";
import Image from "next/image";
import { forwardRef } from "react";
import { usePathname } from "next/navigation";
import { useRecipeStore } from "../../store/recipe";
import { useRouter } from "next/navigation";
import Loading from "../Loading/Loading";
import RecipeView from "../RecipeView/RecipeView";
import Button from "../Button/Button";
import { auth, db } from "../../hooks/userAuth";
import { getIdToken } from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { useUserStore } from "../../store/user";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import axios from "axios";
import { Bounce, ToastContainer, toast } from 'react-toastify';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mealOptions, mealMap } from "./data";


const schema = z.object({
  ingredients: z.string().min(3, "Adicione pelo menos 1 ingrediente"),
  mealType: z.string().min(1, "Selecione o tipo de refeição"),
});

export const MealForm = forwardRef<HTMLFormElement>(({ }, ref) => {
  const {
    ingredients: storeIngredients,
    recipeLoading,
    showRecipe,
    recipe,
    setRecipe,
    updateIngredients,
    updateMealOption,
    setRecipeLoading,
    setShowRecipe,
  } = useRecipeStore();

  const [error, setError] = useState(false);
  const [optionMeal, setOptionMeal] = useState("almoco");
  const [recipeMealOption, setRecipeMealOption] = useState("");
  const [ingredients, setIngredients] = useState(storeIngredients || "");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();

  let count = user?.plan?.recipeCount;

  const [countRecipes, setCountRecipes] = useState(count);

  const notify = () => toast.error("Ocorreu um erro ao gerar a receita");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });


  useEffect(() => {
    if (error) {
      setTimeout(() => {
        notify();
      }, 100);
      setError(null)
    }
  }, [error]);



  const handleChangeMeal = (event) => {
    const optionMeal = mealOptions.find(
      (option) => option.value === event.target.value
    );
    setOptionMeal(optionMeal.value ? optionMeal.value : "");
  };

  const handleChangeIngredients = (event) => {
    setIngredients(event.target.value);
  };

  const handleGetRecipe = async (e: MouseEvent<HTMLButtonElement>) => {
    if (!auth.currentUser) {
      updateIngredients(ingredients);
      updateMealOption(optionMeal);
      router.push("/signup");
      return;
    }

    const token = await getIdToken(auth.currentUser);

    if (!token) {
      return console.log("unauthorized");
    }

    setRecipeLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini`,
        {
          optionMeal: optionMeal,
          ingredients: ingredients,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      updateIngredients(null);
      updateMealOption(null);
      setShowRecipe(true);
      setIngredients("");
      setRecipe(response.data);
      setRecipeMealOption(mealMap[response.data.optionMeal]);

      // contador de receitas
      const newRecipesCount = countRecipes - 1;

      setCountRecipes(newRecipesCount);

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        plan: {
          updatedAt: serverTimestamp(),
          recipesCount: newRecipesCount,
        },
      });
    } catch (error) {
      setRecipeLoading(false);
      setError(true)

      return console.log(error);
    } finally {
      setTimeout(() => {
        setRecipeLoading(false);
      }, 4000);
    }
  };

  if (recipeLoading) {
    return <Loading />;
  }

  return (
    <>
      {!showRecipe && (
        <form onSubmit={handleSubmit(handleGetRecipe)} className="w-full flex flex-col text-left max-w-[720px]" ref={ref}>
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">
            1
          </div>
          <label className="secondary-header py-3">
            Liste os ingredientes que você possuí em casa
          </label>
          <input
            {...register("ingredients")}
            id="Ingredients"
            className="global-input focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite Seus Ingredientes"
            value={ingredients}
            onChange={handleChangeIngredients}
          />
          <span className="text-sm mt-4">
            Separe os seus ingrediente por vírgula
            <br />
            Ex: Arroz, ovo, presunto, queijo
          </span>
          <span className="text-red-700 text-sm m-2">
            {errors?.ingredients?.message.toString()}
          </span>
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">
            2
          </div>
          <label className="secondary-header py-3">
            Selecione qual refeição irá preparar
          </label>
          <div className="relative mb-12">
            <select
              {...register("mealType")}

              id="countries"
              className="global-input focus:ring-blue-500 focus:border-blue-500"
              onChange={handleChangeMeal}
            >
              {mealOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
            <span className="text-red-700 text-sm m-2">
              {errors?.mealType?.message.toString()}
            </span>
            <Image
              src="/images/arrow-down.svg"
              className="top-4 right-4 absolute h-4 w-auto"
              width={24}
              height={24}
              alt="Arow Down Icon"
            />
          </div>
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
                      Você ainda pode gerar {user.plan.recipeCount} receitas.
                      Faça um{" "}
                      <Link className="text-black" href="/plans">
                        upgrade
                      </Link>{" "}
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
                    <p>
                      Você atingiu o limite de receitas. Faça um upgrade para
                      continuar usando.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
          {user?.plan.recipeCount === 0 ? (
            <Link
              className="flex justify-center gap-2 bg-secondary w-full py-4 text-white rounded-lg border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold no-underline"
              href={"/plans"}
            >
              Upgrade
            </Link>
          ) : (
            <Button
              text="Gerar Receita"
            >
              Gerar Receita
            </Button>
          )}
        </form>
      )}
      {showRecipe && <RecipeView />}
    </>
  );
});

MealForm.displayName = "MealForm";

export default MealForm;
