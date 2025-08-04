import { X } from 'lucide-react';

interface IngredientTagProps {
  ingredient: string;
  onRemove: (ingredient: string) => void;
}

export default function IngredientTag({ ingredient, onRemove }: IngredientTagProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
      <span>{ingredient}</span>
      <button
        type="button"
        onClick={() => onRemove(ingredient)}
        className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
        aria-label={`Remover ${ingredient}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}