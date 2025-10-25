import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Award, List, TrendingUp, Bell, Search } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import PostCardEnhanced from '../components/PostCardEnhanced';
import PostCreateModal from '../components/PostCreateModal';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';

interface College {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  location?: string;
  rank?: number;
  description?: string;
  memberCount: number;
  challengeCount: number;
  postCount: number;
}

interface Member {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  points: number;
  createdAt: string;
  postCount: number;
  submissionCount: number;
  followerCount: number;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  points: number;
  postCount: number;
  submissionCount: number;
  acceptedCount: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  code?: string;
  language?: string;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

const CollegeCommunity: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const [activeTab, setActiveTab] = useState('feed');
  const [college, setCollege] = useState<College | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    if (collegeId) {
      fetchCollegeData();
    }
  }, [collegeId]);

  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [collegeData, membersData, leaderboardData, postsData] = await Promise.all([
        api.getCollege(collegeId!),
        api.getCollegeMembers(collegeId!, 1, 10),
        api.getCollegeLeaderboard(collegeId!, 10),
        api.getCollegePosts(collegeId!, 1, 20),
      ]);

      setCollege(collegeData);
      setMembers(membersData.members || []);
      setLeaderboard(leaderboardData.leaderboard || []);
      setPosts(postsData.posts || []);
    } catch (err) {
      console.error('Error fetching college data:', err);
      setError('Failed to load college data');
      showError('Failed to load college data');
      // Set empty arrays to prevent crashes
      setMembers([]);
      setLeaderboard([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading college community..." />
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="College Not Found"
          description="The college you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* College Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-start space-x-6">
          {college.logoUrl && (
            <img
              src={college.logoUrl}
              alt={`${college.name} logo`}
              className="w-20 h-20 rounded-lg object-contain"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {college.name}
              </h1>
              {college.rank && (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  #{college.rank}
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              {college.shortName} • {college.location}
            </p>
            {college.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {college.description}
              </p>
            )}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {college.memberCount} Members
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {college.challengeCount} Challenges
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <List className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {college.postCount} Posts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8">
        {[
          { id: 'feed', label: 'Feed', icon: List },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-600 text-neutral-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Posts
                </h2>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                >
                  Create Post
                </Button>
              </div>
              {posts.length === 0 ? (
                <EmptyState
                  icon={List}
                  title="No Posts Yet"
                  description="Be the first to share something with the community!"
                />
              ) : (
                posts.map((post) => (
                  <PostCardEnhanced
                    key={post.id}
                    post={post}
                    onLike={(postId) => {
                      // Handle like
                      console.log('Liked post:', postId);
                    }}
                    onComment={(postId) => {
                      // Handle comment
                      console.log('Comment on post:', postId);
                    }}
                    onShare={(postId) => {
                      // Handle share
                      console.log('Share post:', postId);
                    }}
                    onBookmark={(postId) => {
                      // Handle bookmark
                      console.log('Bookmark post:', postId);
                    }}
                    onReport={(postId) => {
                      // Handle report
                      console.log('Report post:', postId);
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Community Members
              </h2>
              {members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Members Yet"
                  description="This college community is just getting started!"
                />
              ) : (
                <div className="grid gap-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={member.avatarUrl}
                          name={member.name}
                          size="lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {member.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            @{member.username}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              {member.points} points
                            </span>
                            <span className="text-sm text-gray-500">
                              {member.postCount} posts
                            </span>
                            <span className="text-sm text-gray-500">
                              {member.followerCount} followers
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Community Leaderboard
              </h2>
              {leaderboard.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No Rankings Yet"
                  description="Start participating to climb the leaderboard!"
                />
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {entry.rank <= 3 ? (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                entry.rank === 1
                                  ? 'bg-yellow-500'
                                  : entry.rank === 2
                                  ? 'bg-gray-400'
                                  : 'bg-orange-500'
                              }`}
                            >
                              {entry.rank}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold">
                              {entry.rank}
                            </div>
                          )}
                        </div>
                        <Avatar
                          src={entry.avatarUrl}
                          name={entry.name}
                          size="md"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {entry.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            @{entry.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.points} pts
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.acceptedCount}/{entry.submissionCount} solved
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Community Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Members</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {college.memberCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Challenges</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {college.challengeCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {college.postCount}
                </span>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          {leaderboard.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Top Contributors
              </h3>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {entry.rank <= 3 ? (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            entry.rank === 1
                              ? 'bg-yellow-500'
                              : entry.rank === 2
                              ? 'bg-gray-400'
                              : 'bg-orange-500'
                          }`}
                        >
                          {entry.rank}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold">
                          {entry.rank}
                        </div>
                      )}
                    </div>
                    <Avatar
                      src={entry.avatarUrl}
                      name={entry.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.points} points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Create Modal */}
      <PostCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={(newPost) => {
          setPosts(prev => [newPost, ...prev]);
          setCollege(prev => prev ? { ...prev, postCount: prev.postCount + 1 } : prev);
          setShowCreateModal(false);
        }}
        collegeId={collegeId} // Pass the collegeId
      />
    </div>
  );
};

export default CollegeCommunity;