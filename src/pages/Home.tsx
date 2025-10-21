import React, { useState, useEffect } from 'react';
import { Flame, Clock, UserPlus, Filter, Code, PenTool } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { EmptyPosts } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import ReactLazy from 'react';
const PostCard = ReactLazy.lazy(() => import('../components/PostCard'));
import PostCreateModal from '../components/PostCreateModal';
import { api, Post, Challenge, User, usersApi, postsApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
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
  const [openCommentSections, setOpenCommentSections] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  // Load posts based on active tab
  const loadPosts = async (page: number = 1) => {
    try {
      setIsLoading(true);
      let response;
      
      switch (activeTab) {
        case 'trending':
          // Get posts sorted by likes and comments (trending)
          response = await postsApi.getPosts(page, 10, 'trending');
          break;
        case 'newest':
          // Get posts sorted by creation date (newest)
          response = await postsApi.getPosts(page, 10, 'newest');
          break;
        case 'following':
          // Get posts from followed users
          response = await postsApi.getPosts(page, 10, 'following');
          break;
        default:
          response = await postsApi.getPosts(page, 10);
      }
      
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

  const handleLikePost = async (postId: string) => {
    try {
      await api.likePost(postId);
      // Update the post in the local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, _count: { ...post._count, likes: post._count?.likes + 1 || 1 } }
          : post
      ));
    } catch (err: any) {
      error('Failed to like post', err.message);
    }
  };

  const handleCommentPost = async (postId: string) => {
    try {
      // Toggle comment section visibility
      setOpenCommentSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    } catch (err: any) {
      error('Failed to toggle comment section', err.message);
    }
  };

  const handleCommentAdded = (postId: string, count: number) => {
    // Update comment count in local state when a new comment is added
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, _count: { ...post._count, comments: count } }
        : post
    ));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 lg:max-w-4xl">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to Codnite</h1>
              <p className="text-slate-400">Discover amazing code, share your projects, and connect with developers</p>
            </div>

            {/* Enhanced Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700/50 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'trending'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Flame className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Trending</span>
                  <span className="sm:hidden">Hot</span>
                </button>
                <button
                  onClick={() => setActiveTab('newest')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'newest'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Newest</span>
                  <span className="sm:hidden">New</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'following'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Following</span>
                  <span className="sm:hidden">Feed</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                  <Filter className="h-5 w-5" />
                </button>
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg border-0"
                  leftIcon={<PenTool className="h-4 w-4" />}
                >
                  <span className="hidden sm:inline">Create Post</span>
                  <span className="sm:hidden">Post</span>
                </Button>
              </div>
            </div>

            {/* Feed Content */}
            {isLoading ? (
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="bg-slate-800/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-700 rounded w-full"></div>
                      <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                <div className="animate-pulse">
                  <div className="bg-slate-800/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-700 rounded w-full"></div>
                      <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center">
                  <PenTool className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-slate-400 mb-6">Be the first to share something amazing!</p>
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                  leftIcon={<PenTool className="h-4 w-4" />}
                >
                  Create First Post
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-900/50"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <React.Suspense fallback={<div className="h-48 bg-slate-800/40 rounded-2xl animate-pulse" />}> 
                        <PostCard
                          post={post}
                          onLike={handleLikePost}
                          onComment={handleCommentPost}
                          onCommentCountChange={handleCommentAdded}
                          onShare={() => {}}
                          onBookmark={() => {}}
                          showComments={openCommentSections.has(post.id)}
                        />
                      </React.Suspense>
                    </div>
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
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
          <div className="w-full lg:w-80 space-y-6">
            {/* Weekly Challenge */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/70 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg">
                  Weekly Challenge
                </h3>
              </div>
              
              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <Code className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">No challenges available</p>
                </div>
              ) : (
                challenges.slice(0, 1).map((challenge) => (
                  <div key={challenge.id} className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2 text-lg">
                        {challenge.title}
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Time Remaining</span>
                        <span className="font-semibold text-orange-400 text-sm">
                          {formatTimeRemaining(challenge.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Participants</span>
                        <span className="font-semibold text-white text-sm">
                          {challenge._count?.submissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Points</span>
                        <span className="font-semibold text-green-400 text-sm">{challenge.points}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Difficulty</span>
                        <Badge 
                          text={challenge.difficulty} 
                          color="blue" 
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg shadow-primary-500/25 border-0">
                      Join Challenge
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Suggested Users */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/70 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg">
                  Suggested for You
                </h3>
              </div>
              
              {!suggestedUsers || suggestedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">No suggestions available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestedUsers.map((user, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        alt={user.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">
                          {user.name}
                        </h4>
                        <p className="text-slate-400 text-xs truncate">
                          @{user.username} • {user.collegeId}
                        </p>
                        <p className="text-primary-400 text-xs font-medium">
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
                        className={`${
                          followingUsers.has(user.id) 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0' 
                            : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
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