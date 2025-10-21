import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Share2, Award, Code, Activity, Bookmark, Calendar, Linkedin, Star, Edit3, Camera } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import ProfileEditModal from '../components/ProfileEditModal';
import UserStats from '../components/UserStats';
import UserBadges from '../components/UserBadges';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import MessageButton from '../components/MessageButton';
import FollowersModal from '../components/FollowersModal';
import { api, User, Post } from '../services/api';
import { useToast } from '../components/ui/Toast';
const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState('posts');
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const { addToast } = useToast();

  // Check if this is the current user
  const checkIfCurrentUser = () => {
    // Get current user from App.tsx state or localStorage
    const currentUser = localStorage.getItem('user');
    console.log('Current user from localStorage:', currentUser);
    console.log('Current userId from params:', userId);
    
    if (currentUser) {
      const parsedUser = JSON.parse(currentUser);
      console.log('Parsed user:', parsedUser);
      const isCurrent = parsedUser.id === userId || userId === 'me';
      console.log('Is current user:', isCurrent);
      console.log('User ID comparison:', parsedUser.id, '===', userId, '=', parsedUser.id === userId);
      setIsCurrentUser(isCurrent);
    }
  };

  // Load user data
  const loadUser = async () => {
    if (!userId) return;
    
    console.log('Loading user for userId:', userId);
    
    try {
      setIsLoading(true);
      
      // Determine the actual user ID to fetch
      let actualUserId = userId;
      
      if (userId === 'me') {
        // Get current user ID from localStorage or API
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser);
          actualUserId = parsedUser.id;
          console.log('Using userId from localStorage:', actualUserId);
        } else {
          // Fallback: get current user from API
          try {
            const currentUserData = await api.getMe();
            actualUserId = currentUserData.id;
            console.log('Using userId from API:', actualUserId);
          } catch (error) {
            console.error('Failed to get current user:', error);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
      }
      
      console.log('Final actualUserId:', actualUserId);
      
      if (!actualUserId) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Load all user data in parallel with proper error handling
      const [userData, userStats, userBadges, userAchievements, userSkills, userActivity, followStatus] = await Promise.all([
        api.getUser(actualUserId).catch(() => null),
        api.getUserStats(actualUserId).catch(() => null),
        api.getUserBadges(actualUserId).catch(() => []),
        api.getUserAchievements(actualUserId).catch(() => []),
        api.getUserSkills(actualUserId).catch(() => []),
        api.getUserActivity(actualUserId).catch(() => []),
        !isCurrentUser ? api.getFollowStatus(actualUserId).catch(() => ({ isFollowing: false })) : Promise.resolve({ isFollowing: false })
      ]);
      
      console.log('Loaded user data:', userData);
      
      setUser(userData);
      setStats(userStats);
      setBadges(Array.isArray(userBadges) ? userBadges : []);
      setAchievements(Array.isArray(userAchievements) ? userAchievements : []);
      setSkills(Array.isArray(userSkills) ? userSkills : []);
      setActivity(Array.isArray(userActivity) ? userActivity : []);
      setIsFollowing(followStatus?.isFollowing || false);
      
    } catch (err: any) {
      console.error('Error loading user:', err);
      setUser(null);
      addToast('Failed to load user profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user posts
  const loadUserPosts = async () => {
    if (!userId) {
      console.log('No userId provided');
      return;
    }
    
    try {
      console.log('Loading posts for userId:', userId);
      
      // Determine the actual user ID to fetch (same logic as loadUser)
      let actualUserId = userId;
      if (userId === 'me') {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser);
          actualUserId = parsedUser.id;
          console.log('Using userId from localStorage for posts:', actualUserId);
        } else {
          try {
            const currentUserData = await api.getMe();
            actualUserId = currentUserData.id;
            console.log('Using userId from API for posts:', actualUserId);
          } catch (error) {
            console.error('Failed to get current user for posts:', error);
            setPosts([]);
            return;
          }
        }
      }
      
      console.log('API call: api.getUserPosts(actualUserId)');
      const userPosts = await api.getUserPosts(actualUserId);
      console.log('Raw API response:', userPosts);
      console.log('Posts array check:', Array.isArray(userPosts), userPosts?.length);
      console.log('Setting posts to:', Array.isArray(userPosts) ? userPosts : []);
      setPosts(Array.isArray(userPosts) ? userPosts : []);
    } catch (err: any) {
      console.error('Error loading user posts:', err);
      console.error('Error details:', err.response?.data || err.message);
      setPosts([]);
      addToast('Failed to load user posts', 'error');
    }
  };

  // Load saved posts
  const loadSavedPosts = async () => {
    if (!isCurrentUser) return;
    
    try {
      const { bookmarkApi } = await import('../services/api');
      const savedPostsData = await bookmarkApi.getBookmarkedPosts(1, 20);
      setSavedPosts(Array.isArray(savedPostsData.posts) ? savedPostsData.posts : []);
    } catch (err: any) {
      // If endpoint is not available (404) or unauthorized, just show empty saved list silently
      setSavedPosts([]);
    }
  };

  // Load data on mount
  useEffect(() => {
    const initializeProfile = async () => {
      checkIfCurrentUser();
      await loadUser();
      await loadUserPosts();
    };
    
    initializeProfile();
  }, [userId]);

  // Load saved posts when isCurrentUser becomes true
  useEffect(() => {
    if (isCurrentUser) {
      loadSavedPosts();
    }
  }, [isCurrentUser]);

  // Load saved posts when saved tab is clicked
  useEffect(() => {
    if (activeTab === 'saved' && isCurrentUser) {
      loadSavedPosts();
    }
  }, [activeTab, isCurrentUser]);

  // Handle profile update
  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    addToast('Profile updated successfully!', 'success');
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <Loading text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <EmptyState
          title="User not found"
          description="The user you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  return (
    <div className="min-h-screen bg-ember-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border overflow-hidden mb-8 shadow-strong">
          {/* Cover Image */}
          <div 
            className="h-48 relative"
            style={{
              backgroundImage: user.coverPhotoUrl 
                ? `url(${user.coverPhotoUrl})` 
                : 'linear-gradient(to right, #FF6A00, #FF2D00)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            
            {/* Cover Photo Edit Button - Only show for current user */}
            {isCurrentUser && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const formData = new FormData();
                          formData.append('coverPhoto', file);
                          
                          const result = await api.uploadCoverPhoto(formData);
                          
                          if (result.success) {
                            setUser(prev => prev ? { ...prev, coverPhotoUrl: result.coverPhotoUrl } : null);
                            addToast('Cover photo updated successfully!', 'success');
                            
                            // Update localStorage as well
                            const currentUser = localStorage.getItem('user');
                            if (currentUser) {
                              const parsedUser = JSON.parse(currentUser);
                              parsedUser.coverPhotoUrl = result.coverPhotoUrl;
                              localStorage.setItem('user', JSON.stringify(parsedUser));
                            }
                          } else {
                            addToast(result.error || 'Failed to upload cover photo', 'error');
                          }
                        } catch (error: any) {
                          addToast('Failed to upload cover photo', 'error');
                        }
                      }
                    };
                    input.click();
                  }}
                  className="bg-ember-bg-secondary/50 backdrop-blur-sm hover:bg-ember-bg-tertiary/50 rounded-full p-2 transition-all duration-300 group"
                  title="Change cover photo"
                >
                  <Edit3 className="h-4 w-4 text-white group-hover:text-primary-300" />
                </button>
              </div>
            )}
            
            <div className="absolute bottom-4 right-4">
              <div className="bg-ember-bg-secondary/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-ember-border">
                <span className="text-white text-sm font-medium">Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="p-8 relative">
            <div className="absolute -top-20 left-8 bg-ember-bg-secondary rounded-2xl p-3 border-4 border-ember-bg-secondary shadow-glow">
              <Avatar 
                src={user.avatarUrl} 
                alt={user.name}
                size="lg"
                editable={isCurrentUser}
                onAvatarChange={(newAvatarUrl) => {
                  setUser(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
                  // Update localStorage as well
                  const currentUser = localStorage.getItem('user');
                  if (currentUser) {
                    const parsedUser = JSON.parse(currentUser);
                    parsedUser.avatarUrl = newAvatarUrl;
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                  }
                }}
              />
              {isCurrentUser && (
                <div className="absolute -bottom-2 -right-2">
                  <button
                    onClick={() => {
                      // Trigger avatar upload modal
                      const avatarElement = document.querySelector('.avatar-edit-button') as HTMLButtonElement;
                      if (avatarElement) {
                        avatarElement.click();
                      }
                    }}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-full p-2 shadow-glow transition-all duration-300"
                    title="Change Avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="ml-40 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-ember-text-primary mr-4">
                    {user.name}
                  </h1>
                  {badges && badges.length > 0 && (
                    <div className="flex space-x-2">
                      {badges.slice(0, 2).map((badge, index) => (
                        <Badge 
                          key={index}
                          text={badge.name || badge} 
                          color={index === 0 ? 'orange' : 'blue'} 
                          size="md"
                          className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-primary-600/30 text-primary-300"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-ember-text-secondary text-lg">@{user.username}</p>
                {user.bio && (
                  <p className="mt-3 text-ember-text-primary leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>
              
              <div className="flex mt-6 md:mt-0 space-x-3">
                {isCurrentUser ? (
                  <Button
                    variant="outline"
                    leftIcon={<Edit3 className="h-4 w-4" />}
                    onClick={() => setIsEditing(true)}
                    className="border-ember-border text-ember-text-primary hover:bg-ember-bg-hover hover:text-primary-300 hover:border-primary-600/50"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <MessageButton
                      userId={user.id}
                      userName={user.name}
                      userAvatar={user.avatarUrl}
                      size="md"
                    />
                    <FollowButton
                      userId={user.id}
                      isFollowing={isFollowing}
                      onFollowChange={setIsFollowing}
                      size="md"
                    />
                  </>
                )}
                <Button 
                  variant="ghost" 
                  leftIcon={<Share2 className="h-4 w-4" />}
                  className="text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover"
                >
                  Share
                </Button>
              </div>
            </div>
            
            {/* Links and Info */}
            <div className="mt-8 pt-6 border-t border-ember-border">
              <div className="flex flex-wrap gap-6">
                {user.collegeId && (
                  <div className="flex items-center text-ember-text-secondary">
                    <Award className="h-5 w-5 mr-2" />
                    <span className="font-medium">{user.collegeId}</span>
                  </div>
                )}
                {user.githubUsername && (
                  <div className="flex items-center text-ember-text-secondary">
                    <Code className="h-5 w-5 mr-2" />
                    <a 
                      href={`https://github.com/${user.githubUsername}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary-400 transition-colors font-medium"
                    >
                      {user.githubUsername}
                    </a>
                  </div>
                )}
                {user.linkedinUrl && (
                  <div className="flex items-center text-ember-text-secondary">
                    <Linkedin className="h-5 w-5 mr-2" />
                    <a 
                      href={user.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary-400 transition-colors font-medium"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                <div className="flex items-center text-ember-text-secondary">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-medium">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-ember-border">
              <UserStats 
                user={user} 
                stats={stats} 
                onFollowersClick={() => {
                  setFollowersModalType('followers');
                  setShowFollowersModal(true);
                }}
                onFollowingClick={() => {
                  setFollowersModalType('following');
                  setShowFollowersModal(true);
                }}
              />
            </div>
          </div>
          
          {/* Enhanced Tabs */}
          <div className="flex border-t border-ember-border overflow-x-auto">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-6 transition-all duration-300 font-medium relative ${
                activeTab === 'posts'
                  ? 'border-b-2 border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                  : 'text-ember-text-secondary hover:text-ember-text-primary'
              }`}
            >
              {activeTab === 'posts' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
              )}
              Posts
            </button>
            {isCurrentUser && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-6 transition-all duration-300 font-medium relative ${
                  activeTab === 'saved'
                    ? 'border-b-2 border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                    : 'text-ember-text-secondary hover:text-ember-text-primary'
                }`}
              >
                {activeTab === 'saved' && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
                )}
                Saved
              </button>
            )}
            <button
              onClick={() => setActiveTab('solutions')}
              className={`py-4 px-6 transition-all duration-300 font-medium relative ${
                activeTab === 'solutions'
                  ? 'border-b-2 border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                  : 'text-ember-text-secondary hover:text-ember-text-primary'
              }`}
            >
              {activeTab === 'solutions' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
              )}
              Solutions
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-4 px-6 transition-all duration-300 font-medium relative ${
                activeTab === 'achievements'
                  ? 'border-b-2 border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                  : 'text-ember-text-secondary hover:text-ember-text-primary'
              }`}
            >
              {activeTab === 'achievements' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
              )}
              Achievements
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`py-4 px-6 transition-all duration-300 font-medium relative ${
                activeTab === 'badges'
                  ? 'border-b-2 border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                  : 'text-ember-text-secondary hover:text-ember-text-primary'
              }`}
            >
              {activeTab === 'badges' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
              )}
              Badges
            </button>
          </div>
        </div>
      
        {/* Tab Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {!posts || posts.length === 0 ? (
                  <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-12 text-center">
                    <div className="w-16 h-16 bg-ember-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-ember-text-muted" />
                    </div>
                    <h3 className="text-xl font-semibold text-ember-text-primary mb-2">No posts yet</h3>
                    <p className="text-ember-text-secondary">This user hasn't shared any posts yet.</p>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-strong"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <PostCard
                        post={post}
                        onLike={() => {}}
                        onComment={() => {}}
                        onShare={() => {}}
                        onBookmark={() => {}}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'saved' && (
              <div className="space-y-6">
                {!savedPosts || savedPosts.length === 0 ? (
                  <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-12 text-center">
                    <div className="w-16 h-16 bg-ember-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="h-8 w-8 text-ember-text-muted" />
                    </div>
                    <h3 className="text-xl font-semibold text-ember-text-primary mb-2">No saved posts yet</h3>
                    <p className="text-ember-text-secondary">You haven't saved any posts yet. Start exploring and save posts you like!</p>
                  </div>
                ) : (
                  savedPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-strong"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <PostCard
                        post={post}
                        onLike={() => {}}
                        onComment={() => {}}
                        onShare={() => {}}
                        onBookmark={() => {}}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'solutions' && (
              <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-12 text-center">
                <div className="w-16 h-16 bg-ember-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-ember-text-muted" />
                </div>
                <h3 className="text-xl font-semibold text-ember-text-primary mb-2">No solutions yet</h3>
                <p className="text-ember-text-secondary">This user hasn't shared any problem solutions yet.</p>
              </div>
            )}
            
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                {!achievements || achievements.length === 0 ? (
                  <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-12 text-center">
                    <div className="w-16 h-16 bg-ember-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-ember-text-muted" />
                    </div>
                    <h3 className="text-xl font-semibold text-ember-text-primary mb-2">No achievements yet</h3>
                    <p className="text-ember-text-secondary">This user hasn't earned any achievements yet.</p>
                  </div>
                ) : (
                  achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-6 hover:bg-ember-bg-tertiary hover:shadow-glow transition-all duration-300">
                      <div className="flex">
                    <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 h-12 w-12 rounded-xl flex items-center justify-center mr-4">
                          {achievement.icon === 'trophy' && <Award className="h-6 w-6 text-primary-400" />}
                          {achievement.icon === 'activity' && <Activity className="h-6 w-6 text-primary-400" />}
                          {achievement.icon === 'star' && <Star className="h-6 w-6 text-primary-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-ember-text-primary text-lg">
                                {achievement.title}
                              </h3>
                              <p className="text-ember-text-secondary">
                                {achievement.description}
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-success-500/20 to-success-400/20 border border-success-500/30 rounded-full px-3 py-1 text-sm">
                              <span className="text-success-400 font-medium">+{achievement.points} points</span>
                            </div>
                          </div>
                          <div className="mt-2 text-ember-text-muted text-sm">
                            {achievement.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'badges' && (
              <UserBadges badges={badges || []} />
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Skills */}
            <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-6 hover:bg-ember-bg-tertiary hover:shadow-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mr-4 shadow-glow">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-ember-text-primary text-xl">Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {!skills || skills.length === 0 ? (
                  <p className="text-ember-text-secondary text-sm">No skills added yet</p>
                ) : (
                  skills.map((skill, index) => (
                    <Badge
                      key={index}
                      text={skill}
                      color={index % 3 === 0 ? 'orange' : index % 3 === 1 ? 'blue' : 'purple'}
                      className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-primary-600/30 text-primary-300"
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border p-6 hover:bg-ember-bg-tertiary hover:shadow-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-success-600 to-success-500 rounded-xl flex items-center justify-center mr-4 shadow-soft">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-ember-text-primary text-xl">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {!activity || activity.length === 0 ? (
                  <p className="text-ember-text-secondary text-sm">No recent activity</p>
                ) : (
                  activity.map((item, index) => (
                    <div key={index} className="flex p-3 rounded-xl hover:bg-ember-bg-hover transition-all duration-300">
                      <div className="mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary-400"></div>
                      </div>
                      <div>
                        <p className="text-sm text-ember-text-primary">
                          {item.type === 'post' ? (
                            <>Created post <span className="text-primary-400 font-medium">{item.title}</span></>
                          ) : (
                            <>Solved <span className="text-primary-400 font-medium">{item.problem_title}</span> problem</>
                          )}
                        </p>
                        <p className="text-ember-text-muted text-xs mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      
      {/* Profile Edit Modal */}
      {isCurrentUser && (
        <ProfileEditModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={user.id}
        type={followersModalType}
        userName={user.name}
      />
      </div>
    </div>
  );
};
export default Profile;