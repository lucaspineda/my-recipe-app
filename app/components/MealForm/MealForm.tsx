import React, { ChangeEvent, useState, MouseEvent } from "react";
import Image from "next/image";
import { forwardRef } from "react";
import { getAuth } from "firebase/auth";
import { usePathname } from "next/navigation";
import { useRecipeStore } from "../../store/recipe";
import { useRouter } from "next/navigation";
import Loading from "../Loading/Loading";
import RecipeView from "../RecipeView/RecipeView";
import Button from "../Button/Button";

export const MealForm = forwardRef(({ }, ref) => {
  const {
    ingredients: storeIngredients,
    recipeLoading,
    showRecipe,
    updateIngredients,
    updateMealOption,
    setRecipeLoading,
    setShowRecipe
  } = useRecipeStore();

  const [recipe, setRecipe] = useState("");
  const [optionMeal, setOptionMeal] = useState("almoco");
  const [recipeMealOption, setRecipeMealOption] = useState("");
  const [ingredients, setIngredients] = useState(storeIngredients || "");
  const pathname = usePathname();
  const router = useRouter()

  const mealOptions = [
    {
      text: "Almoço",
      value: "almoco",
    },
    {
      text: "Café da Manhã",
      value: "cafe",
    },
    {
      text: "Lanche",
      value: "lanche",
    },
    {
      text: "Janta",
      value: "janta",
    },
  ];

  const mealMap = {
    almoco: "Almoço",
    cafe: "Café da Manhã",
    lanche: "Lanche",
    janta: "Janta",
  };

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
    e.preventDefault()

    const auth = getAuth();

    if (!auth.currentUser) {
      // send ingredients and recipe to store
      // send user to sign up
      updateIngredients(ingredients);
      updateMealOption(optionMeal);
      router.push("/signup");
      return;
    } else {
      updateIngredients(null)
      updateMealOption(null);
      setShowRecipe(true);
      setIngredients('')
    }

    const token = auth.currentUser?.accessToken;

    if (!token) {
      return console.log("unauthorized");
    }

    setRecipeLoading(true)

    try {
      const response = await fetch("http://localhost:3003/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          optionMeal: optionMeal,
          ingredients: ingredients,
        }),
      });

      const responseJson = await response.json();
      setRecipe(responseJson.recipe);
      setRecipeMealOption(mealMap[responseJson.optionMeal]);
    } catch (error) {
      return console.log(error)
    } finally {
      setTimeout(() => {
        setRecipeLoading(false);
      }, 3000);
    }
  };


  if (recipeLoading) {
    return (
      <Loading />
    )
  }

  return (
    <>
      {!showRecipe && (
        <form className="w-full flex flex-col text-left" ref={ref}>
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">
            1
          </div>
          <label className="secondary-header py-3">
            Adicione ingredientes que você possuí em casa
          </label>
          <input
            id="Ingredients"
            className="global-input focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite Seus Ingredientes"
            imgsource="/images/fork-knife.svg"
            imgalt="Icone de faca"
            value={ingredients}
            onChange={handleChangeIngredients}
          />
          <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">
            2
          </div>
          <label className="secondary-header py-3">
            Selecione qual refeição irá preparar
          </label>
          <div className="relative">
            <select
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
            <Image
              src="/images/arrow-down.svg"
              className="top-4 right-4 absolute h-4 w-auto"
              width={24}
              height={24}
              alt="Arow Down Icon"
            />
          </div>
          <Button
            onClick={handleGetRecipe}
            text="Gerar Receita"
          >
            Gerar Receita
          </Button>
        </form >
      )}
      {recipe ? (
        <div className="bg-tertiary px-6 py-10 rounded-lg self-start text-2xl text-center mx-auto">
          <h1 className="">
            {recipeMealOption.includes("Janta")
              ? `Sua receita para a ${recipeMealOption}`
              : `Sua receita para o ${recipeMealOption}`}
          </h1>
          <h2 className="mt-10 text-left">
            <div
              dangerouslySetInnerHTML={{ __html: recipe }}
            />

          </h2>
        </div>
      ) : (
        <>
          {
            showRecipe && <RecipeView />
          }
        </>
      )}
    </>
  );
});

MealForm.displayName = "MealForm";

export default MealForm;
