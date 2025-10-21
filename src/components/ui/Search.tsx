import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';

interface SearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
  debounceMs?: number;
  showClearButton?: boolean;
}

export const Search: React.FC<SearchProps> = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  className = '',
  debounceMs = 300,
  showClearButton = true
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      debounceRef.current = setTimeout(() => {
        onSearch(query);
        setIsSearching(false);
      }, debounceMs);
    } else {
      setIsSearching(false);
      if (onClear) {
        onClear();
      }
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, onClear, debounceMs]);

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  const searchIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const clearIcon = (
    <button
      type="button"
      onClick={handleClear}
      className="text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  const loadingIcon = (
    <div className="animate-spin">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={isSearching ? loadingIcon : searchIcon}
        rightIcon={query && showClearButton ? clearIcon : undefined}
        className="pr-10"
      />
    </div>
  );
};

// Search Results Component
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'post' | 'user' | 'challenge';
  url: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onResultClick: (result: SearchResult) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  query,
  onResultClick,
  className = ''
}) => {
  if (isLoading) {
    return (
      // FIX 1: Change background, border, and loading text for dark mode
      <div className={`dark:bg-dark-800 dark:border-dark-700 rounded-lg shadow-lg mt-1 ${className}`}> 
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin">
              {/* FIX 2: Change loading icon color to your primary orange */}
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            {/* FIX 3: Change loading text color */}
            <span className="text-sm text-gray-400">Searching...</span> 
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return null;
  }

  if (results.length === 0) {
    return (
      // FIX 4: Change background, border, and text for no results found
      <div className={`dark:bg-dark-800 dark:border-dark-700 rounded-lg shadow-lg mt-1 ${className}`}>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-400">No results found for "{query}"</p>
        </div>
      </div>
    );
  }

  return (
    // FIX 5: Change main results container background/border/hover
    <div className={`dark:bg-dark-800 dark:border-dark-700 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto ${className}`}>
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onResultClick(result)}
          // FIX 6: Change hover/border colors. Use a darker background on hover.
          className="w-full text-left p-4 dark:hover:bg-dark-700 border-b dark:border-dark-700 last:border-b-0 transition-colors"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {result.type === 'post' && (
                // FIX 7: Change blue icon background and foreground color to Ember Flow
                <div className="w-8 h-8 bg-primary-950 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              {result.type === 'user' && (
                // FIX 8: Change green icon background and foreground color to Ember Flow (I used primary/secondary for a consistent look)
                <div className="w-8 h-8 bg-secondary-950 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {result.type === 'challenge' && (
                // FIX 9: Change purple icon background and foreground color to Ember Flow
                <div className="w-8 h-8 bg-primary-950 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* FIX 10: Change primary text color */}
              <p className="text-sm font-medium text-gray-100 truncate"> 
                {result.title}
              </p>
              {result.description && (
                {/* FIX 11: Change secondary text color */}
                <p className="text-sm text-gray-400 truncate">
                  {result.description}
                </p>
              )}
              {/* FIX 12: Change type label color */}
              <p className="text-xs text-gray-500 capitalize">
                {result.type}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};