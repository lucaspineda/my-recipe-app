import { useState, useRef, useEffect } from 'react';
import { INGREDIENTES } from './constants';
import IngredientTag from './IngredientTag';
import SuggestionsList from './SuggestionsList';

interface IngredientsInputProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function IngredientsInput({
  selectedIngredients,
  onIngredientsChange,
  placeholder = "Digite um ingrediente...",
  className = ""
}: IngredientsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtra sugestões baseado no input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = INGREDIENTES
      .filter(ingredient => 
        ingredient.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedIngredients.includes(ingredient)
      )
      .slice(0, 5);

    setSuggestions(filtered);
  }, [inputValue, selectedIngredients]);

  const addIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      onIngredientsChange([...selectedIngredients, ingredient]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(selectedIngredients.filter(item => item !== ingredient));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addIngredient(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay para permitir clique nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="global-input focus:ring-2 focus:ring-secondary focus:border-secondary"
          data-clarity-unmask="true"
        />
        
        <SuggestionsList
          suggestions={suggestions}
          onSelect={addIngredient}
          isVisible={showSuggestions}
        />
      </div>

      {/* Tags Container */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedIngredients.map((ingredient) => (
            <IngredientTag
              key={ingredient}
              ingredient={ingredient}
              onRemove={removeIngredient}
            />
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-sm text-gray-600 mt-2">
        Digite para buscar ingredientes. Pressione Enter ou clique para adicionar.
      </p>
    </div>
  );
}