'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSubmitSearch: (query: string) => void;
  recentSearches: string[];
  onClearHistory: () => void;
  onRemoveSearch: (query: string) => void;
}

export function SearchBar({ onSearch, onSubmitSearch, recentSearches, onClearHistory, onRemoveSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length > 0) {
      debounceRef.current = setTimeout(() => {
        onSearch(query.trim());
      }, 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  const handleSubmit = () => {
    if (query.trim().length > 0) {
      onSearch(query.trim());
      onSubmitSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSelectHistory = (q: string) => {
    setQuery(q);
    setShowHistory(false);
    onSearch(q);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar lecciones, genios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); onSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <span className="material-icons-round text-gray-500 text-lg">close</span>
            </button>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <span className="material-icons-round text-primary text-2xl">search</span>
        </button>
      </div>

      {/* Recent searches dropdown */}
      {showHistory && recentSearches.length > 0 && !query && (
        <div className="absolute top-full left-0 right-16 mt-2 bg-surface-dark/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Busquedas recientes</span>
            <button onClick={onClearHistory} className="text-xs text-primary">
              Limpiar
            </button>
          </div>
          {recentSearches.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => handleSelectHistory(s)}
              className="flex items-center justify-between w-full py-2 px-1 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-base text-gray-500">history</span>
                {s}
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); onRemoveSearch(s); }}
                className="material-icons-round text-base text-gray-600 hover:text-gray-400"
              >
                close
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
