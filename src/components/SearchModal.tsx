import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, User, Code, Trophy, BookOpen, Hash } from 'lucide-react';
import { searchApi } from '../services/api';
import { Post, User as UserType, Challenge, Problem } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { PortalModal } from './ui/PortalModal';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  posts: Post[];
  users: UserType[];
  challenges: Challenge[];
  problems: Problem[];
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    users: [],
    challenges: [],
    problems: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'challenges' | 'problems'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    language: 'all',
    difficulty: 'all'
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');
  const isSearchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Always display combined results by default for each new query
    setActiveTab('all');

    // console.log('Starting search for:', searchQuery);

    // Skip duplicate in-flight queries
    if (isSearchingRef.current && lastQueryRef.current === searchQuery) {
      return;
    }
    isSearchingRef.current = true;
    lastQueryRef.current = searchQuery;
    setLoading(true);
    try {
      const [postsRes, usersRes, challengesRes, problemsRes] = await Promise.all([
        searchApi.searchPosts(searchQuery, 1, 10).catch(err => {
          console.error('Error searching posts:', err);
          return { posts: [] };
        }),
        searchApi.searchUsers(searchQuery, 1, 10).catch(err => {
          console.error('Error searching users:', err);
          return { users: [] };
        }),
        searchApi.searchChallenges(searchQuery, 1, 10).catch(err => {
          console.error('Error searching challenges:', err);
          return { challenges: [] };
        }),
        searchApi.searchProblems(searchQuery, 1, 10).catch(err => {
          console.error('Error searching problems:', err);
          return { problems: [] };
        })
      ]);

      const newResults = {
        posts: postsRes.posts || [],
        users: usersRes.users || [],
        challenges: challengesRes.challenges || [],
        problems: problemsRes.problems || []
      };

      // Minimal log for development; safe to remove in production
      // console.log('Search completed:', newResults);

      setResults(newResults);

      // If only one category has results, focus that tab for better visibility
      const counts = {
        posts: newResults.posts.length,
        users: newResults.users.length,
        challenges: newResults.challenges.length,
        problems: newResults.problems.length,
      };
      const nonZero = Object.entries(counts).filter(([, v]) => v > 0);
      if (nonZero.length === 1) {
        // typesafe cast since keys align to tabs
        setActiveTab(nonZero[0][0] as any);
      }

      // Add to recent searches
      const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Search error:', error);
      setResults({ posts: [], users: [], challenges: [], problems: [] });
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input changed:', value);
    setQuery(value);
    
    if (value.trim()) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Triggering search for:', value);
        handleSearch(value);
      }, 300);
    } else {
      setResults({ posts: [], users: [], challenges: [], problems: [] });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ posts: [], users: [], challenges: [], problems: [] });
  };

  const getTotalResults = () => {
    return results.posts.length + results.users.length + results.challenges.length + results.problems.length;
  };

  const renderPostResult = (post: Post) => (
    <div key={post.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{post.title}</h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{post.content}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
            <span>By {post.author?.name || post.author_name || 'Unknown'}</span>
            <span>{formatDistanceToNow(new Date(post.created_at || post.createdAt))} ago</span>
            <span>{post.like_count || post._count?.likes || 0} likes</span>
            <span>{post.comment_count || post._count?.comments || 0} comments</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserResult = (user: UserType) => (
    <div key={user.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium">{user.name || 'Unknown User'}</h3>
          <p className="text-slate-400 text-sm">@{user.username || 'unknown'}</p>
          <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
            <span>{user.points || 0} points</span>
            <span>{user.college?.name || user.college_name || 'No college'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChallengeResult = (challenge: Challenge) => (
    <div key={challenge.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium">{challenge.title}</h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{challenge.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">{challenge.difficulty}</span>
            <span>{challenge.points || 0} points</span>
            <span>{challenge.submission_count || challenge.submissionCount || 0} submissions</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProblemResult = (problem: Problem) => (
    <div key={problem.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
          <Code className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium">{problem.title}</h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{problem.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">{problem.difficulty}</span>
            <span>{problem.points || 0} points</span>
            <span>{problem.tags?.join(', ') || 'No tags'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className="py-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700/60 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-700/40 rounded w-2/3" />
            </div>
          ))}
        </div>
      );
    }

    if (!query.trim()) {
      return (
        <div className="py-8">
          <h3 className="text-white font-medium mb-4">Recent Searches</h3>
          {recentSearches.length > 0 ? (
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center space-x-3"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{search}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              Start typing to search posts, users, challenges, and problems.
            </div>
          )}
        </div>
      );
    }

    if (getTotalResults() === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No results found</h3>
          <p className="text-slate-400">Try different keywords or check your spelling</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">
            {getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''} for "{query}"
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All</option>
                  <option value="posts">Posts</option>
                  <option value="users">Users</option>
                  <option value="challenges">Challenges</option>
                  <option value="problems">Problems</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results by Tab */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {results.posts.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Posts ({results.posts.length})</span>
                </h4>
                <div className="space-y-0">
                  {results.posts.slice(0, 3).map(renderPostResult)}
                </div>
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Users ({results.users.length})</span>
                </h4>
                <div className="space-y-0">
                  {results.users.slice(0, 3).map(renderUserResult)}
                </div>
              </div>
            )}

            {results.challenges.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Challenges ({results.challenges.length})</span>
                </h4>
                <div className="space-y-0">
                  {results.challenges.slice(0, 3).map(renderChallengeResult)}
                </div>
              </div>
            )}

            {results.problems.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Problems ({results.problems.length})</span>
                </h4>
                <div className="space-y-0">
                  {results.problems.slice(0, 3).map(renderProblemResult)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-0">
            {results.posts.map(renderPostResult)}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-0">
            {results.users.map(renderUserResult)}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-0">
            {results.challenges.map(renderChallengeResult)}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-0">
            {results.problems.map(renderProblemResult)}
          </div>
        )}
      </div>
    );
  };

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={false}
      className="max-h-[90vh]"
    >
      {/* Header */}
      <div className="mb-6" role="search">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Search posts, users, challenges, problems..."
              className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'all', label: 'All', count: getTotalResults() },
            { id: 'posts', label: 'Posts', count: results.posts.length },
            { id: 'users', label: 'Users', count: results.users.length },
            { id: 'challenges', label: 'Challenges', count: results.challenges.length },
            { id: 'problems', label: 'Problems', count: results.problems.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[60vh] min-h-[200px] overflow-y-auto" aria-live="polite">
        {renderResults()}
      </div>
    </PortalModal>
  );
};

export default SearchModal;
