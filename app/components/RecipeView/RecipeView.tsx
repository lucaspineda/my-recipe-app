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
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="m-2 p-2 rounded-md border-2 bg-transparent transition-colors flex items-center justify-center hover:bg-cyan-100 focus:outline-none"
                style={{ borderColor: '#0f6374' }}
                title="Comprar Ingredientes"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                  style={{ color: '#0f6374' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.16 16l.84-2h8l.84 2H7.16zM6 6h15l-1.68 7.39A2 2 0 0117.36 15H8.64a2 2 0 01-1.96-1.61L4 4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
              <button
                type="button"
                className="m-2 p-2 rounded-md border-2 bg-transparent transition-colors flex items-center justify-center hover:bg-cyan-100 focus:outline-none"
                style={{ borderColor: '#0f6374' }}
                title="Compartilhar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                  style={{ color: '#0f6374' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <h1 className="text-secondary text-3xl font-bold mt-8">{title}  </h1>
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
