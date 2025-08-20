interface SuggestionsListProps {
  suggestions: string[];
  inputValue: string;
  onSelect: (ingredient: string) => void;
  onAddCustom: (ingredient: string) => void;
  isVisible: boolean;
}

export default function SuggestionsList({ suggestions, inputValue, onSelect, onAddCustom, isVisible }: SuggestionsListProps) {
  if (!isVisible || suggestions.length === 0) {
    // Show "adicionar" option even when no suggestions match
    if (!inputValue.trim()) {
      return null;
    }
  }

  const hasExactMatch = suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase());
  const showAddCustom = inputValue.trim() && !hasExactMatch;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors"
          onClick={() => onSelect(suggestion)}
          onMouseDown={(e) => e.preventDefault()} // Previne blur do input
        >
          {suggestion}
        </button>
      ))}
      {showAddCustom && (
        <button
          key="add-custom"
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-t border-gray-100 text-secondary font-medium transition-colors"
          onClick={() => onAddCustom(inputValue.trim())}
          onMouseDown={(e) => e.preventDefault()}
        >
          + Adicionar "{inputValue.trim()}"
        </button>
      )}
    </div>
  );
}