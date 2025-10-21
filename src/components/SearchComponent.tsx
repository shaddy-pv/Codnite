import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, Hash, User, FileText, Code, Trophy } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Badge from './ui/Badge';
import { searchApi } from '../services/api';
import { useToast } from './ui/Toast';
import { useDebounce } from '../hooks/usePerformance';

interface SearchFilters {
  type: 'all' | 'posts' | 'users' | 'challenges' | 'problems';
  category?: string;
  tags?: string[];
  difficulty?: string;
  sortBy: 'relevance' | 'date' | 'popularity';
}

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'challenge' | 'problem';
  title: string;
  description?: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  tags?: string[];
  category?: string;
  difficulty?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
}

interface SearchComponentProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onResultSelect,
  placeholder = 'Search posts, users, challenges...',
  className = '',
  showFilters = true
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'relevance'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const { error } = useToast();

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  // Search function
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchApi.search({
        query: searchQuery,
        type: searchFilters.type,
        category: searchFilters.category,
        tags: searchFilters.tags,
        difficulty: searchFilters.difficulty,
        sortBy: searchFilters.sortBy,
        limit: 20
      });

      setResults(response.results || []);
    } catch (err: any) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Perform search when query changes
  React.useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, filters);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery, filters, performSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
    setShowResults(false);
    setQuery('');
  }, [onResultSelect]);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      sortBy: 'relevance'
    });
  }, []);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'challenge': return <Trophy className="h-4 w-4" />;
      case 'problem': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'challenge': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'problem': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          onFocus={() => setShowResults(true)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Search Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All', icon: Search },
                  { value: 'posts', label: 'Posts', icon: FileText },
                  { value: 'users', label: 'Users', icon: User },
                  { value: 'challenges', label: 'Challenges', icon: Trophy },
                  { value: 'problems', label: 'Problems', icon: Code }
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={filters.type === type.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange({ type: type.value as any })}
                    leftIcon={<type.icon className="h-3 w-3" />}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'date', label: 'Date' },
                  { value: 'popularity', label: 'Popularity' }
                ].map((sort) => (
                  <Button
                    key={sort.value}
                    variant={filters.sortBy === sort.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange({ sortBy: sort.value as any })}
                  >
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-30">
          {isSearching ? (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getResultTypeColor(result.type)}`}>
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {result.title}
                        </h4>
                        <Badge variant="outline" size="sm">
                          {result.type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {result.author && (
                          <span>by {result.author.name}</span>
                        )}
                        <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                        {result.likes && (
                          <span>{result.likes} likes</span>
                        )}
                      </div>
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
