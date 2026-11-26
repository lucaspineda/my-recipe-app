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

  // Typed text that matches a list item (any case) uses the list's spelling.
  const toCanonical = (text: string) =>
    INGREDIENTES.find((item) => item.toLowerCase() === text.toLowerCase()) ?? text;

  const isSelected = (text: string) =>
    selectedIngredients.some((item) => item.toLowerCase() === text.toLowerCase());

  // Adds any typed text, whether or not it is in the suggestion list.
  const addIngredients = (items: string[], { refocus = true } = {}) => {
    const toAdd: string[] = [];
    items.forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const ingredient = toCanonical(trimmed);
      const alreadyAdded =
        isSelected(ingredient) || toAdd.some((item) => item.toLowerCase() === ingredient.toLowerCase());
      if (!alreadyAdded) toAdd.push(ingredient);
    });
    if (toAdd.length > 0) {
      onIngredientsChange([...selectedIngredients, ...toAdd]);
    }
    setInputValue('');
    setIsOpen(false);
    if (refocus) {
      // Keep input focused after adding
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const addIngredient = (ingredient: string) => addIngredients([ingredient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (inputValue.trim()) {
          addIngredients([inputValue], { refocus: false });
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  const toggleIngredient = (ingredient: string) => {
    if (isSelected(ingredient)) {
      onIngredientsChange(selectedIngredients.filter((item) => item.toLowerCase() !== ingredient.toLowerCase()));
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
    const value = e.target.value;
    // A comma adds what came before it. Handled here rather than on keydown,
    // because Android keyboards don't report the comma key on keydown.
    // Also splits pasted lists like "ovos, tomate, cebola".
    if (value.includes(',')) {
      const parts = value.split(',');
      const rest = parts.pop() ?? '';
      addIngredients(parts);
      setInputValue(rest.trimStart());
      if (rest.trim()) setIsOpen(true);
      return;
    }
    setInputValue(value);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Never submit the surrounding form from here.
      e.preventDefault();
      if (inputValue.trim()) {
        addIngredient(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedIngredients.length > 0) {
      removeIngredient(selectedIngredients[selectedIngredients.length - 1]);
    }
  };

  const handleAddClick = () => {
    if (inputValue.trim()) {
      addIngredient(inputValue);
    } else {
      setIsOpen(true);
      inputRef.current?.focus();
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

  const typedValue = inputValue.trim();
  // Offer the typed text itself unless it is already a list item or already added.
  const showAddTyped =
    typedValue.length > 0 &&
    !isSelected(typedValue) &&
    !INGREDIENTES.some((item) => item.toLowerCase() === typedValue.toLowerCase());

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      <p className="text-base text-gray-600 mb-2">
        Digite para buscar ou adicionar ingredientes personalizados
      </p>

      <div className="relative">
        <div
          data-ingredients-box
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
            
            {/* Field and its Adicionar button wrap to a new line together. */}
            <div className="flex flex-1 min-w-[11rem] items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                enterKeyHint="enter"
                aria-label="Ingrediente"
                placeholder={selectedIngredients.length === 0 ? placeholder : ''}
                className="flex-1 w-0 min-w-0 outline-none bg-transparent text-gray-700"
              />
              <button
                type="button"
                // Keep focus in the field so the phone keyboard stays open.
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick();
                }}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
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
              {showAddTyped && (
                <div
                  onClick={() => addIngredient(typedValue)}
                  className="px-4 py-3 text-gray-700 hover:bg-secondary/10 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>
                    Adicionar &quot;<span className="font-medium">{typedValue}</span>&quot;
                  </span>
                </div>
              )}
              {suggestions.map((ingredient) => {
                const selected = isSelected(ingredient);
                return (
                  <div
                    key={ingredient}
                    onClick={() => toggleIngredient(ingredient)}
                    className={`px-4 py-3 hover:bg-secondary/10 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                      selected ? 'bg-secondary/5' : ''
                    }`}
                  >
                    <span className={`text-gray-700 ${selected ? 'font-medium text-secondary' : ''}`}>
                      {ingredient}
                    </span>
                    {selected && <Check className="w-5 h-5 text-secondary" />}
                  </div>
                );
              })}
              {!showAddTyped && suggestions.length === 0 && (
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
