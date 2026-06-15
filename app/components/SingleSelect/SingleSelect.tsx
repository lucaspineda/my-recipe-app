import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  text: string;
}

interface SingleSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SingleSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  className = '',
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Display Box */}
      <div className="relative">
        <div
          onClick={toggleDropdown}
          className="min-h-[48px] w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white hover:border-secondary transition-colors cursor-pointer content-center"
        >
          <div className="flex items-center justify-between gap-2">
            <span className={selectedOption ? 'text-gray-700' : 'text-gray-400'}>
              {selectedOption ? selectedOption.text : placeholder}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-hidden flex flex-col">
            {/* Options List */}
            <div className="overflow-y-auto flex-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-4 py-3 hover:bg-secondary/10 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                      isSelected ? 'bg-secondary/5' : ''
                    }`}
                  >
                    <span className={`text-gray-700 ${isSelected ? 'font-medium text-secondary' : ''}`}>
                      {option.text}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-secondary" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
