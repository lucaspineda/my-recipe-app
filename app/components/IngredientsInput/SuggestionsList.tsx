interface SuggestionsListProps {
  suggestions: string[];
  onSelect: (ingredient: string) => void;
  isVisible: boolean;
}

export default function SuggestionsList({ suggestions, onSelect, isVisible }: SuggestionsListProps) {
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

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
    </div>
  );
}