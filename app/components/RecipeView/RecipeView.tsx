import { useRecipeStore } from "../../store/recipe";
import Button from "../Button/Button";
import { MouseEvent } from "react";

export default function RecipeView() {
  const handleGetOtherRecipe = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setShowRecipe(false);
  };

  const { setShowRecipe } = useRecipeStore();

  return (
    <div>
      <h2 className="bg-tertiary px-6 py-10 rounded-lg self-start text-2xl text-center mx-auto">
        Crie sua primeira receita!
      </h2>
      Recipe here
      <Button
        className="mt-12"
        onClick={handleGetOtherRecipe}
        text="Gerar outra receita"
      />
    </div>
  );
}
