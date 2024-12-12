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
        <section>
          <div>
            <h1 className="mt-8">{title}</h1>
            <p>{introduction}</p>
            <br />

            <h3>
              <strong>Ingredientes:</strong>
            </h3>

            <ul>
              {ingredients.map((ingredients, index) => (
                <li key={index}>
                  {" "}
                  • {ingredients.nome || ingredients.item} -{" "}
                  {ingredients.quantidade}
                </li>
              ))}
            </ul>
            <br />

            <h3>
              <strong>Modo de Preparo:</strong>
            </h3>
            <ul>
              {preparationMethod.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>

            <br />
            <h3>
              <strong>Observações:</strong>
            </h3>
            <ul>
              {observations.map((obs, index) => (
                <li key={index}> - {obs}</li>
              ))}
            </ul>
          </div>

          <Button
            className="mt-12"
            onClick={handleGetOtherRecipe}
            text="Gerar outra receita"
          />
        </section>
      )}
    </>
  );
}
