import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import Badge from './ui/Badge';
import { Loading, PostSkeleton } from './ui/Loading';
import { EmptyState } from './ui/EmptyState';
import { api, Problem } from '../services/api';
import { useToast } from './ui/Toast';

interface ProblemListProps {
  onProblemSelect: (problem: Problem) => void;
  className?: string;
}

const ProblemList: React.FC<ProblemListProps> = ({ onProblemSelect, className = '' }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { addToast } = useToast();

  // Load problems
  const loadProblems = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) setIsLoading(true);
      
      const filters = {
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        tag: selectedTag !== 'all' ? selectedTag : undefined,
        search: searchTerm || undefined,
      };

      const data = await api.getProblems(pageNum, 20, filters);
      
      if (reset) {
        setProblems(data.problems);
      } else {
        setProblems(prev => [...prev, ...data.problems]);
      }
      
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err: any) {
      addToast('Failed to load problems', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load problems on mount and when filters change
  useEffect(() => {
    setPage(1);
    loadProblems(1, true);
  }, [searchTerm, selectedDifficulty, selectedTag]);

  // Load more problems
  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProblems(nextPage, false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'hard':
        return 'red';
      default:
        return 'blue';
    }
  };

  const formatAcceptanceRate = (rate: number | string | null | undefined) => {
    if (rate === null || rate === undefined || rate === '') {
      return 'N/A';
    }
    
    const numericRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    
    if (isNaN(numericRate)) {
      return 'N/A';
    }
    
    return `${numericRate.toFixed(1)}%`;
  };

  const difficulties = ['all', 'easy', 'medium', 'hard'];
  const tags = ['all', 'array', 'string', 'hash-table', 'dynamic-programming', 'tree', 'graph', 'sorting'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Problems
          </h2>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {problems.length} problems
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff === 'all' ? 'All' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag === 'all' ? 'All' : tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Problems List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <PostSkeleton count={5} />
        ) : problems.length === 0 ? (
          <EmptyState
            title="No problems found"
            description="Try adjusting your search criteria or check back later for new problems."
          />
        ) : (
          problems.map((problem) => (
            <div
              key={problem.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onProblemSelect(problem)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {problem.title}
                    </h3>
                    <Badge
                      text={problem.difficulty}
                      color={getDifficultyColor(problem.difficulty)}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Acceptance: {formatAcceptanceRate(problem.acceptanceRate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{problem._count?.submissions || 0} submissions</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} text={tag} color="blue" size="sm" />
                    ))}
                    {problem.tags.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{problem.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {problem._count?.accepted || 0} solved
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && !isLoading && problems.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            Load More Problems
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProblemList;
