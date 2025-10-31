import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={selectRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-3 pr-10 py-3 text-left bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 flex justify-between items-center"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value || placeholder || 'Select an option'}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="relative p-2 border-b border-slate-700">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border-none rounded-md pl-8 pr-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <ul className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 text-white hover:bg-slate-700 cursor-pointer"
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
