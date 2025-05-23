import { useRecipeStore } from "../../store/recipe";
import Button from "../Button/Button";
import { MouseEvent } from "react";

export default function RecipeView() {
  const { setShowRecipe, recipe, showRecipe } = useRecipeStore();
  const handleGetOtherRecipe = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setShowRecipe(false);
  };

  let newRecipe = recipe.replace(/```json|```/g, "").trim();

  let newRecipeObject = JSON.parse(newRecipe);

  const title = newRecipeObject?.titulo;
  const introduction = newRecipeObject?.introducao;
  const ingredients = newRecipeObject?.ingredientes;
  const preparationMethod = newRecipeObject?.modoDePreparo;
  const observations = newRecipeObject?.observacoes;

  return (
    <>
      {showRecipe && (
        <section className="max-w-[1200px] mx-auto p-6 rounded-lg ">
          <div>
            <h1 className="text-secondary text-3xl font-bold mt-8">{title}</h1>
            <p className="text-gray-900 mt-4 text-lg">{introduction}</p>
            <br />

            <div className="mt-8">
              <h3 className="text-secondary text-2xl font-semibold">Ingredientes:</h3>
              <ul className="list-disc pl-6 mt-4 text-lg text-gray-900">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="mt-2">
                    {ingredient.nome || ingredient.item} - {ingredient.quantidade}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="text-secondary text-2xl font-semibold">Modo de Preparo:</h3>
              <ol className="list-decimal pl-6 mt-4 text-lg text-gray-900">
                {preparationMethod.map((step, index) => (
                  <li key={index} className="mt-2">{step}</li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <h3 className="text-secondary text-2xl font-semibold">Observações:</h3>
              <ul className="list-disc pl-6 mt-4 text-lg text-gray-900 italic">
                {observations.map((obs, index) => (
                  <li key={index} className="mt-2"> {obs}</li>
                ))}
              </ul>
            </div>

          </div>
          <div className="mt-12 text-center">
            <Button
              className="mt-12 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-900 transition duration-300"
              onClick={handleGetOtherRecipe}
            >
              Gerar outra receita
            </Button>
          </div>
        </section >
      )
      }
    </>
  );
}
