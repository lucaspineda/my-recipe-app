import React, { ChangeEvent, useState, MouseEvent } from "react";
import Image from "next/image";
import { forwardRef } from "react";
import { usePathname } from "next/navigation";
import { useRecipeStore } from "../../store/recipe";
import { useRouter } from "next/navigation";
import Loading from "../Loading/Loading";
import RecipeView from "../RecipeView/RecipeView";
import Button from "../Button/Button";
import { auth, db } from "../../hooks/userAuth";
import { getIdToken, signOut } from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useUserStore } from "../../store/user";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";

export const MealForm = forwardRef(({ }, ref) => {
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

  // const [recipe, setRecipe] = useState("");
  const [optionMeal, setOptionMeal] = useState("almoco");
  const [recipeMealOption, setRecipeMealOption] = useState("");
  const [ingredients, setIngredients] = useState(storeIngredients || "");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();

  let count = user?.plan?.recipesCount;

  const [countRecipes, setCountRecipes] = useState(count);

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
    e.preventDefault();

    if (!auth.currentUser) {
      updateIngredients(ingredients);
      updateMealOption(optionMeal);
      router.push("/signup");
      return;
    } else {
      updateIngredients(null);
      updateMealOption(null);
      setShowRecipe(true);
      setIngredients("");
    }

    const token = auth.currentUser?.accessToken;

    if (!token) {
      return console.log("unauthorized");
    }

    setRecipeLoading(true);
    const newToken = await getIdToken(auth.currentUser);

    try {
      const response = await fetch("http://localhost:3003/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: newToken,
        },
        body: JSON.stringify({
          optionMeal: optionMeal,
          ingredients: ingredients,
        }),
      });

      const responseJson = await response.json();
      setRecipe(responseJson);
      setRecipeMealOption(mealMap[responseJson.optionMeal]);

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
          <div className="relative mb-12">
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
          {user?.plan.planId !== 3 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                {user?.plan.recipesCount < 3 && user?.plan.recipesCount > 0 && (
                  <>
                    <AlertCircle
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="Hello world!"
                      color="#f6e8d3"
                      fill="black"
                      size={42}
                    />
                    <p>
                      Você ainda pode gerar {user.plan.recipesCount} receitas.
                      Faça um{" "}
                      <Link className="text-black" href="/plans">
                        upgrade
                      </Link>{" "}
                      para continuar usando.
                    </p>
                  </>
                )}
                {user?.plan.recipesCount === 0 && (
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
          {user?.plan.recipesCount === 0 ? (
            <Link
              className="flex justify-center gap-2 bg-secondary w-full py-4 text-white rounded-lg border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold no-underline"
              href={"/plans"}
            >
              Upgrade
            </Link>
          ) : (
            <Button
              onClick={handleGetRecipe}
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
