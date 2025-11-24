import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { INGREDIENTES } from './constants';
import IngredientTag from './IngredientTag';
import { ChevronDown, X, Plus, Check } from 'lucide-react';

interface IngredientsInputProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  placeholder?: string;
  className?: string;
}

const IngredientsInput = forwardRef<HTMLInputElement, IngredientsInputProps>(({
  selectedIngredients,
  onIngredientsChange,
  placeholder = 'Digite para buscar ingredientes...',
  className = '',
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  } as HTMLInputElement));

  useEffect(() => {
    const filtered = INGREDIENTES.filter((ingredient) => {
      const matchesInput =
        inputValue.trim().length === 0 || ingredient.toLowerCase().includes(inputValue.toLowerCase());
      return matchesInput;
    }).slice(0, 10);

    setSuggestions(filtered);
  }, [inputValue, selectedIngredients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !selectedIngredients.includes(trimmedValue)) {
          onIngredientsChange([...selectedIngredients, trimmedValue]);
        }
        setIsOpen(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, selectedIngredients, onIngredientsChange]);

  const addIngredient = (ingredient: string) => {
    const trimmedIngredient = ingredient.trim();
    if (trimmedIngredient && !selectedIngredients.includes(trimmedIngredient)) {
      onIngredientsChange([...selectedIngredients, trimmedIngredient]);
    }
    setInputValue('');
    setIsOpen(false);
    // Keep input focused after adding
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      removeIngredient(ingredient);
    } else {
      addIngredient(ingredient);
    }
    setIsOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(selectedIngredients.filter((item) => item !== ingredient));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && inputValue.trim()) {
        const firstSuggestion = suggestions[0];
        if (firstSuggestion.toLowerCase() === inputValue.toLowerCase()) {
          toggleIngredient(firstSuggestion);
        } else if (inputValue.trim()) {
          addIngredient(inputValue.trim());
        }
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedIngredients.length > 0) {
      removeIngredient(selectedIngredients[selectedIngredients.length - 1]);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIngredientsChange([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      <p className="text-sm text-gray-600 mb-2">
        Digite para buscar ou adicionar ingredientes personalizados
      </p>

      <div className="relative">
        <div
          onClick={handleInputClick}
          className="min-h-[48px] w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white hover:border-secondary transition-colors flex flex-wrap gap-2 items-start cursor-text content-center"
        >
          <div className="flex flex-wrap gap-2 items-center flex-1">
            {selectedIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-md text-sm"
              >
                {ingredient}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeIngredient(ingredient);
                  }}
                />
              </span>
            ))}
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedIngredients.length === 0 ? placeholder : ''}
              className="flex-1 w-0 outline-none bg-transparent text-gray-700"
            />
          </div>
          
          <div className="flex items-center gap-2 self-center flex-shrink-0">
            {selectedIngredients.length > 0 && (
              <>
                <X
                  className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                  onClick={clearAll}
                />
                <div className="h-5 w-px bg-gray-300" />
              </>
            )}
            
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`}
              onClick={toggleDropdown}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              {suggestions.length > 0 ? (
                suggestions.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient);
                  return (
                    <div
                      key={ingredient}
                      onClick={() => toggleIngredient(ingredient)}
                      className={`px-4 py-3 hover:bg-secondary/10 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                        isSelected ? 'bg-secondary/5' : ''
                      }`}
                    >
                      <span className={`text-gray-700 ${isSelected ? 'font-medium text-secondary' : ''}`}>
                        {ingredient}
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-secondary" />}
                    </div>
                  );
                })
              ) : inputValue ? (
                <div 
                  onClick={() => addIngredient(inputValue)}
                  className="px-4 py-3 text-gray-700 hover:bg-secondary/10 cursor-pointer transition-colors"
                >
                  Adicionar &quot;<span className="font-medium">{inputValue}</span>&quot;
                </div>
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">Digite para buscar ingredientes</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

IngredientsInput.displayName = 'IngredientsInput';

export default IngredientsInput;
