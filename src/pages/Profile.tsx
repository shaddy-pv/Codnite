import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Share2, Award, Code, Activity, Bookmark, MapPin, Briefcase, Calendar, ExternalLink, Linkedin, Globe, TrendingUp, Users, Star, Edit3, ThumbsUp, Camera } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Loading, { PostSkeleton } from '../components/ui/Loading';
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
    if (!userId) return;
    
    try {
      const userPosts = await api.getUserPosts(userId);
      setPosts(Array.isArray(userPosts) ? userPosts : []);
    } catch (err: any) {
      console.error('Error loading user posts:', err);
      setPosts([]);
      addToast('Failed to load user posts', 'error');
    }
  };

  // Load data on mount
  useEffect(() => {
    checkIfCurrentUser();
    loadUser();
    loadUserPosts();
  }, [userId]);

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
    <div className="max-w-screen-xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        
        {/* Profile Info */}
        <div className="p-6 relative">
          <div className="absolute -top-16 left-6 bg-white dark:bg-gray-800 rounded-xl p-2 border-4 border-white dark:border-gray-800">
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
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
                  title="Change Avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-36 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h1>
                {badges && badges.length > 0 && (
                  <div className="ml-3">
                    <Badge text={badges[0].name} color="purple" size="md" />
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>
            
            <div className="flex mt-4 md:mt-0 space-x-2">
              {isCurrentUser ? (
                <Button
                  variant="outline"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                  onClick={() => setIsEditing(true)}
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
              <Button variant="ghost" leftIcon={<Share2 className="h-4 w-4" />}>
                Share
              </Button>
            </div>
          </div>
          
          {/* Bio and Links */}
          <div className="mt-6">
            {user.bio && <p className="mb-4 text-gray-700 dark:text-gray-300">{user.bio}</p>}
            
            <div className="flex flex-wrap gap-y-2">
              {user.collegeId && (
                <div className="flex items-center text-gray-500 dark:text-gray-400 mr-6">
                  <Award className="h-4 w-4 mr-2" />
                  <span>{user.collegeId}</span>
                </div>
              )}
              {user.githubUsername && (
                <div className="flex items-center text-gray-500 dark:text-gray-400 mr-6">
                  <Code className="h-4 w-4 mr-2" />
                  <a 
                    href={`https://github.com/${user.githubUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-blue-500 transition-colors"
                  >
                    {user.githubUsername}
                  </a>
                </div>
              )}
              {user.linkedinUrl && (
                <div className="flex items-center text-gray-500 dark:text-gray-400 mr-6">
                  <Linkedin className="h-4 w-4 mr-2" />
                  <a 
                    href={user.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-blue-500 transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-500 dark:text-gray-400 mr-6">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
        
        {/* Tabs */}
        <div className="flex border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-6 transition-colors ${
              activeTab === 'posts'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`py-3 px-6 transition-colors ${
              activeTab === 'solutions'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Solutions
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-3 px-6 transition-colors ${
              activeTab === 'achievements'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Achievements
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-6 transition-colors ${
              activeTab === 'badges'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Badges
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {!posts || posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="This user hasn't shared any posts yet."
                />
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => {}}
                    onComment={() => {}}
                    onShare={() => {}}
                    onBookmark={() => {}}
                  />
                ))
              )}
            </div>
          )}
          
          {activeTab === 'solutions' && (
            <div className="space-y-6">
              <EmptyState
                title="No solutions yet"
                description="This user hasn't shared any problem solutions yet."
              />
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {!achievements || achievements.length === 0 ? (
                <EmptyState
                  title="No achievements yet"
                  description="This user hasn't earned any achievements yet."
                />
              ) : (
                achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex">
                      <div className="bg-blue-100 dark:bg-blue-900 h-12 w-12 rounded-full flex items-center justify-center mr-4">
                        {achievement.icon === 'trophy' && <Award className="h-6 w-6 text-blue-500" />}
                        {achievement.icon === 'activity' && <Activity className="h-6 w-6 text-blue-500" />}
                        {achievement.icon === 'star' && <Star className="h-6 w-6 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {achievement.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {achievement.description}
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                            +{achievement.points} points
                          </div>
                        </div>
                        <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
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
        <div className="md:w-80 space-y-6">
          {/* Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {!skills || skills.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No skills added yet</p>
              ) : (
                skills.map((skill, index) => (
                  <Badge
                    key={index}
                    text={skill}
                    color={index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'purple' : 'cyan'}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {!activity || activity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
              ) : (
                activity.map((item, index) => (
                  <div key={index} className="flex">
                    <div className="mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.type === 'post' ? (
                          <>Created post <span className="text-blue-500">{item.title}</span></>
                        ) : (
                          <>Solved <span className="text-blue-500">{item.problem_title}</span> problem</>
                        )}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
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
  );
};
export default Profile;