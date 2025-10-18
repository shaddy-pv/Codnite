import React, { useState, useEffect } from 'react';
import { Flame, Clock, UserPlus, Filter, Code, PenTool } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { PostSkeleton } from '../components/ui/Loading';
import { EmptyPosts, EmptyChallenges } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import PostCard from '../components/PostCard';
import PostCreateModal from '../components/PostCreateModal';
import { api, Post, Challenge, User, usersApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { LoadingWrapper, PostLoadingWrapper } from '../components/ui/LoadingWrapper';
import { useAsync, useLoadingStates } from '../hooks/useLoadingStates';
import { NetworkStatus } from '../components/ui/NetworkStatus';
const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { success, error } = useToast();

  // Load posts based on active tab
  const loadPosts = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await api.getPosts(page, 10);
      setPosts(response.posts);
      setTotalPages(response.pagination.pages);
      setCurrentPage(page);
    } catch (err: any) {
      error('Failed to load posts', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load challenges
  const loadChallenges = async () => {
    try {
      const response = await api.getChallenges();
      setChallenges(response);
    } catch (err: any) {
      error('Failed to load challenges', err.message);
    }
  };

  // Load suggested users
  const loadSuggestedUsers = async () => {
    try {
      const response = await usersApi.getSuggestedUsers(5);
      setSuggestedUsers(response.suggestedUsers);
    } catch (err: any) {
      error('Failed to load suggested users', err.message);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadPosts();
    loadChallenges();
    loadSuggestedUsers();
  }, []);

  // Reload posts when tab changes
  useEffect(() => {
    loadPosts(1);
  }, [activeTab]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    success('Post created successfully!');
  };

  const handlePageChange = (page: number) => {
    loadPosts(page);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await api.followUser(userId);
      setFollowingUsers(prev => new Set([...prev, userId]));
      success('Successfully followed user!');
    } catch (err: any) {
      error('Failed to follow user', err.message);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await api.unfollowUser(userId);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      success('Successfully unfollowed user!');
    } catch (err: any) {
      error('Failed to unfollow user', err.message);
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInMs = end.getTime() - now.getTime();
    
    if (diffInMs <= 0) return 'Ended';
    
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };
  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Flame className="h-4 w-4 mr-2 inline" />
                Trending
              </button>
              <button
                onClick={() => setActiveTab('newest')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'newest'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Clock className="h-4 w-4 mr-2 inline" />
                Newest
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'following'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4 mr-2 inline" />
                Following
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <Filter className="h-5 w-5" />
              </button>
              <Button
                onClick={() => setIsCreatingPost(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                leftIcon={<PenTool className="h-4 w-4" />}
              >
                Create Post
              </Button>
            </div>
          </div>

          {/* Feed Content */}
          {isLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <EmptyPosts />
          ) : (
            <>
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => {
                      // Handle like
                    }}
                    onComment={() => {
                      // Handle comment
                    }}
                    onShare={() => {
                      // Handle share
                    }}
                    onBookmark={() => {
                      // Handle bookmark
                    }}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          {/* Weekly Challenge */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Code className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Weekly Challenge
              </h3>
            </div>
            
            {challenges.length === 0 ? (
              <EmptyChallenges />
            ) : (
              challenges.slice(0, 1).map((challenge) => (
                <div key={challenge.id}>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {challenge.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {challenge.description}
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Time Remaining</span>
                      <span className="font-medium text-orange-600">
                        {formatTimeRemaining(challenge.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Participants</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {challenge._count?.submissions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Points</span>
                      <span className="font-medium text-green-600">{challenge.points}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Difficulty</span>
                      <Badge text={challenge.difficulty} color="blue" />
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Join Challenge
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Suggested Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Suggested for You
            </h3>
            {!suggestedUsers || suggestedUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No suggestions available
              </p>
            ) : (
              <div className="space-y-4">
                {suggestedUsers.map((user, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        @{user.username} • {user.collegeId}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-xs">
                        {user.points} points
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={followingUsers.has(user.id) ? "primary" : "outline"}
                      onClick={() => 
                        followingUsers.has(user.id) 
                          ? handleUnfollowUser(user.id) 
                          : handleFollowUser(user.id)
                      }
                    >
                      {followingUsers.has(user.id) ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Creation Modal */}
      <PostCreateModal
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};
export default Home;