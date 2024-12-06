import { useRecipeStore } from "../../store/recipe";
import Button from "../Button/Button";
import { MouseEvent } from "react";
import DOMPurify from 'dompurify';


export default function RecipeView() {
  const { setShowRecipe, recipe, showRecipe } = useRecipeStore();
  const handleGetOtherRecipe = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setShowRecipe(false);
  };

  const cleanRecipe = DOMPurify.sanitize(recipe);


  return (
    <>
      {showRecipe && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: cleanRecipe }}></div>
          <Button
            className="mt-12"
            onClick={handleGetOtherRecipe}
            text="Gerar outra receita"
          />
        </div>
      )}
    </>
  );
}
