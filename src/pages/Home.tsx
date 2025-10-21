import React, { useState, useEffect } from 'react';
import { Flame, Clock, UserPlus, Filter, Code, PenTool } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

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
    <div className="min-h-screen bg-ember-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 lg:max-w-4xl">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-ember-text-primary mb-3 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Welcome to Codnite
              </h1>
              <p className="text-ember-text-secondary text-lg">Discover amazing code, share your projects, and connect with developers</p>
            </div>

            {/* Enhanced Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex space-x-1 bg-ember-bg-secondary backdrop-blur-sm rounded-xl p-1 border border-ember-border w-full sm:w-auto shadow-soft">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'trending'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                      : 'text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover'
                  }`}
                >
                  <Flame className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Trending</span>
                  <span className="sm:hidden">Hot</span>
                </button>
                <button
                  onClick={() => setActiveTab('newest')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'newest'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                      : 'text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Newest</span>
                  <span className="sm:hidden">New</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'following'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                      : 'text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2 inline" />
                  <span className="hidden sm:inline">Following</span>
                  <span className="sm:hidden">Feed</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button className="p-3 text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover hover:scale-110 rounded-xl transition-all duration-300">
                  <Filter className="h-5 w-5" />
                </button>
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white shadow-glow hover:shadow-strong hover:scale-105 border-0 transition-all duration-300"
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
                  <div className="bg-ember-bg-secondary rounded-2xl p-6 border border-ember-border">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-ember-bg-tertiary rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-ember-bg-tertiary rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-ember-bg-tertiary rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-ember-bg-tertiary rounded w-3/4"></div>
                      <div className="h-4 bg-ember-bg-tertiary rounded w-full"></div>
                      <div className="h-4 bg-ember-bg-tertiary rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                <div className="animate-pulse">
                  <div className="bg-ember-bg-secondary rounded-2xl p-6 border border-ember-border">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-ember-bg-tertiary rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-ember-bg-tertiary rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-ember-bg-tertiary rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-ember-bg-tertiary rounded w-3/4"></div>
                      <div className="h-4 bg-ember-bg-tertiary rounded w-full"></div>
                      <div className="h-4 bg-ember-bg-tertiary rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-ember-bg-secondary rounded-full flex items-center justify-center border border-ember-border shadow-soft">
                  <PenTool className="h-12 w-12 text-ember-text-muted" />
                </div>
                <h3 className="text-2xl font-semibold text-ember-text-primary mb-3">No posts yet</h3>
                <p className="text-ember-text-secondary mb-8 text-lg">Be the first to share something amazing!</p>
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300"
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
                      className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-strong"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <React.Suspense fallback={<div className="h-48 bg-ember-bg-secondary rounded-2xl animate-pulse border border-ember-border" />}> 
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
            <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-6 hover:bg-ember-bg-tertiary hover:border-primary-600/30 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mr-4 shadow-glow">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-ember-text-primary text-xl">
                  Weekly Challenge
                </h3>
              </div>
              
              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-ember-bg-tertiary rounded-full flex items-center justify-center border border-ember-border">
                    <Code className="h-8 w-8 text-ember-text-muted" />
                  </div>
                  <p className="text-ember-text-secondary text-sm">No challenges available</p>
                </div>
              ) : (
                challenges.slice(0, 1).map((challenge) => (
                  <div key={challenge.id} className="space-y-5">
                    <div>
                      <h4 className="font-semibold text-ember-text-primary mb-3 text-lg">
                        {challenge.title}
                      </h4>
                      <p className="text-ember-text-secondary text-sm leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-ember-text-secondary text-sm">Time Remaining</span>
                        <span className="font-semibold text-primary-400 text-sm">
                          {formatTimeRemaining(challenge.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ember-text-secondary text-sm">Participants</span>
                        <span className="font-semibold text-ember-text-primary text-sm">
                          {challenge._count?.submissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ember-text-secondary text-sm">Points</span>
                        <span className="font-semibold text-success-400 text-sm">{challenge.points}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ember-text-secondary text-sm">Difficulty</span>
                        <Badge 
                          text={challenge.difficulty} 
                          color="orange"
                          className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-primary-600/30 text-primary-300"
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white shadow-glow hover:shadow-strong hover:scale-105 border-0 transition-all duration-300">
                      Join Challenge
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Suggested Users */}
            <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-6 hover:bg-ember-bg-tertiary hover:border-primary-600/30 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mr-4 shadow-glow">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-ember-text-primary text-xl">
                  Suggested for You
                </h3>
              </div>
              
              {!suggestedUsers || suggestedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-ember-bg-tertiary rounded-full flex items-center justify-center border border-ember-border">
                    <UserPlus className="h-8 w-8 text-ember-text-muted" />
                  </div>
                  <p className="text-ember-text-secondary text-sm">No suggestions available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestedUsers.map((user, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-ember-bg-hover transition-all duration-300 group"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        alt={user.name}
                        size="md"
                        className="ring-2 ring-ember-border group-hover:ring-primary-600/50 transition-all duration-300"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-ember-text-primary text-sm truncate group-hover:text-primary-300 transition-colors duration-300">
                          {user.name}
                        </h4>
                        <p className="text-ember-text-secondary text-xs truncate">
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
                        className={`transition-all duration-300 ${
                          followingUsers.has(user.id) 
                            ? 'bg-gradient-to-r from-success-600 to-success-500 hover:from-success-700 hover:to-success-600 text-white border-0 shadow-soft' 
                            : 'border-ember-border text-ember-text-primary hover:bg-ember-bg-hover hover:text-primary-300 hover:border-primary-600/50'
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