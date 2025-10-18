import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowLeft, TrendingUp, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/FormCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Pagination } from '../components/ui/Pagination';
import { EmptySearch } from '../components/ui/EmptyState';
import { searchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import SearchComponent from '../components/SearchComponent';

interface SearchResult {
  id: string;
  type: 'user';
  name: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  college_id?: string;
  points: number;
  followers_count: number;
  following_count: number;
  created_at: string;
  college_name?: string;
  college_short_name?: string;
  result_type: 'user';
}

interface SearchFilters {
  type: 'users';
  sortBy: 'relevance' | 'date' | 'popularity';
}

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'users',
    sortBy: 'relevance'
  });

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters, pageNum: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchApi.search({
        query: searchQuery,
        type: 'users',
        page: pageNum,
        limit: 20
      });

      // Filter only user results
      const userResults = response.results?.filter((result: any) => result.result_type === 'user') || [];
      
      setResults(userResults);
      setTotalPages(Math.ceil(response.total / 20) || 1);
      setTotalResults(response.total || 0);
      setCurrentPage(pageNum);
    } catch (err: any) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search when query or filters change
  useEffect(() => {
    if (query) {
      performSearch(query, filters, page);
    }
  }, [query, filters, page, performSearch]);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setSearchParams({ q: query, ...updatedFilters });
  }, [filters, query, setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
  }, [query, setSearchParams]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(`/profile/${result.id}`);
  }, [navigate]);

  const getResultIcon = () => <Users className="h-5 w-5" />;

  const getResultTypeColor = () => 'text-green-600 dark:text-green-400';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-4"
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Search
          </h1>
        </div>

        <SearchComponent
          onResultSelect={handleResultClick}
          placeholder="Search users..."
          className="mb-8"
        />

        <EmptySearch />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Search Results
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {totalResults > 0 ? `${totalResults} results for "${query}"` : `No results for "${query}"`}
            </p>
          </div>
          
          <SearchComponent
            onResultSelect={handleResultClick}
            placeholder="Search users..."
            className="w-80"
            showFilters={false}
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Sort By</h3>
          
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
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Card
              key={result.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${getResultTypeColor()}`}>
                  {getResultIcon()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar
                      src={result.avatar_url}
                      name={result.name}
                      size="md"
                    />
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {result.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        @{result.username}
                      </p>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {result.points || 0} points
                    </Badge>
                  </div>
                  
                  {result.bio && (
                    <p className="text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                      {result.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>{result.followers} followers</span>
                    <span>{result.following} following</span>
                    <span>Joined {formatDate(result.createdAt)}</span>
                    {result.collegeId && (
                      <span>{result.collegeId}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    variant={result.isFollowing ? "outline" : "primary"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle follow/unfollow
                    }}
                  >
                    {result.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptySearch query={query} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default SearchResults;
