import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, Medal } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { leaderboardApi, collegesApi, api } from '../services/api';
import { useToast } from '../components/ui/Toast';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('allindia');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollege] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('all');
  const [currentUserRank, setCurrentUserRank] = useState<any>(null);
  const { handleApiError } = useToast();

  // Handle profile navigation
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await leaderboardApi.getLeaderboard(1, 50, timeframe, selectedCollege || undefined);
      setLeaderboardData(response.leaderboard);
    } catch (error: any) {
      handleApiError(error, 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Load colleges
  const loadColleges = async () => {
    try {
      await collegesApi.getColleges(1, 100);
    } catch (error: any) {
      handleApiError(error, 'Failed to load colleges');
    }
  };

  // Load college leaderboard
  const loadCollegeLeaderboard = async (collegeId: string) => {
    try {
      setIsLoading(true);
      const response = await leaderboardApi.getCollegeLeaderboard(collegeId, 20);
      setCollegeLeaderboard(response.leaderboard);
    } catch (error: any) {
      handleApiError(error, 'Failed to load college leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Load current user rank
  const loadCurrentUserRank = async () => {
    try {
      // Get current user data first
      const currentUser = await api.getMe();
      console.log('Current user data:', currentUser);

      // Try to get user rank from leaderboard API
      let userRank = null;
      try {
        userRank = await leaderboardApi.getUserRank(currentUser.id);
      } catch (rankError) {
        console.log('User rank API not available, using fallback');
      }

      setCurrentUserRank({
        rank: userRank?.rank || 1, // Default to rank 1 if no rank found
        points: currentUser.points || 1000, // Use actual user points
        problemsSolved: currentUser.problemsSolved || 0
      });
    } catch (error: any) {
      console.error('Failed to load user rank:', error);
      // Set actual user values as fallback
      setCurrentUserRank({
        rank: 1,
        points: 1000,
        problemsSolved: 0
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLeaderboard();
    loadColleges();
    loadCurrentUserRank();
  }, []);

  // Debug: Log current user rank when it changes
  useEffect(() => {
    console.log('Current user rank updated:', currentUserRank);
  }, [currentUserRank]);

  // Reload when filters change
  useEffect(() => {
    if (activeTab !== 'collegerankings' && activeTab !== 'college') {
      loadLeaderboard();
    } else if (activeTab === 'college' && selectedCollege) {
      loadCollegeLeaderboard(selectedCollege);
    } else if (activeTab === 'collegerankings') {
      console.log("Need to load College Rankings Leaderboard");
    }
  }, [activeTab, selectedCollege, timeframe]);

  return (
    <div className="min-h-screen bg-ember-bg-primary text-ember-text-primary">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ember-text-primary mb-2 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-ember-text-secondary text-base">See where you stand among the best coders</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-ember-bg-secondary rounded-xl border border-ember-border p-6 mb-8 shadow-soft">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-ember-text-muted group-focus-within:text-primary-400 transition-colors duration-300" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 bg-ember-bg-tertiary border border-ember-border rounded-xl text-ember-text-primary text-sm placeholder-ember-text-muted focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 focus:shadow-glow hover:border-ember-border-hover transition-all duration-300"
                placeholder="Search users or colleges..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<Filter className="h-4 w-4" />}
                className="bg-ember-bg-tertiary border-ember-border text-ember-text-primary hover:bg-ember-bg-hover hover:border-primary-600/50 hover:text-primary-300 text-sm px-4 py-3 transition-all duration-300"
              >
                Filters
              </Button>
              <select
                className="bg-ember-bg-tertiary border border-ember-border rounded-xl px-4 py-3 text-ember-text-primary text-sm focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 focus:shadow-glow hover:border-ember-border-hover transition-all duration-300"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
                <option value="day">Today</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ember-border mb-8 overflow-x-auto">
          {[
            { id: 'allindia', name: 'All India' },
            { id: 'state', name: 'State' },
            { id: 'city', name: 'City' },
            { id: 'college', name: 'College' },
            { id: 'collegerankings', name: 'College Rankings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 whitespace-nowrap border-b-2 transition-all duration-300 font-medium text-sm relative group ${activeTab === tab.id
                ? 'border-primary-600 text-primary-400 bg-gradient-to-t from-primary-600/10 to-transparent'
                : 'border-transparent text-ember-text-secondary hover:text-ember-text-primary hover:border-ember-border-hover'
                }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 shadow-glow"></div>
              )}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        {activeTab !== 'collegerankings' ? (
          <div className="bg-ember-bg-secondary rounded-xl border border-ember-border overflow-hidden mb-8 shadow-medium">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ember-bg-tertiary border-b border-ember-border">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">College</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">Problems</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">Badges</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-ember-text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ember-border">
                  {leaderboardData?.length > 0 ? (
                    leaderboardData.map((user, index) => {
                      const rankChange = (user.previousRank || 0) - (user.rank || 0);
                      return (
                        <tr key={user.id} className="hover:bg-ember-bg-hover transition-all duration-300 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`font-bold text-base ${user.rank === 1 ? 'text-yellow-400 drop-shadow-glow' : user.rank === 2 ? 'text-gray-300 drop-shadow-sm' : user.rank === 3 ? 'text-amber-500 drop-shadow-sm' : 'text-ember-text-primary'}`}>
                                #{user.rank || index + 1}
                              </span>
                              {rankChange > 0 && <TrendingUp className="h-4 w-4 text-success-400 ml-2 animate-bounce-subtle" />}
                              {rankChange < 0 && <TrendingDown className="h-4 w-4 text-error-400 ml-2" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar src={user.avatarUrl || '/default-avatar.svg'} alt={user.name || 'Unknown User'} size="md" className="ring-2 ring-ember-border group-hover:ring-primary-600/50 transition-all duration-300" />
                              <div className="ml-4">
                                <div className="font-semibold text-ember-text-primary text-base group-hover:text-primary-300 transition-colors duration-300">{user.name || 'Unknown User'}</div>
                                <div className="text-ember-text-secondary text-sm">@{user.username || 'unknown'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-ember-text-primary text-sm font-medium">{user.college?.name || user.collegeName || 'No College'}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-primary-400 text-base bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-3 py-1 rounded-full border border-primary-600/30">
                              {(user.points || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-ember-text-primary text-sm font-medium">{user.stats?.problemAcceptedCount || user.acceptedCount || 0}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              {user.badges?.length > 0 ? user.badges.slice(0, 3).map((badge: any, index: number) => (
                                <Badge
                                  key={index}
                                  text={badge}
                                  color={index === 0 ? 'orange' : index === 1 ? 'blue' : 'purple'}
                                  className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-primary-600/30 text-primary-300"
                                />
                              )) : <span className="text-ember-text-muted text-xs">No badges</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              rightIcon={<ArrowRight className="h-4 w-4" />}
                              size="sm"
                              onClick={() => handleProfileClick(user.id)}
                              className="text-ember-text-secondary hover:text-primary-300 hover:bg-primary-600/10 text-sm px-4 py-2 rounded-lg transition-all duration-300"
                            >
                              Profile
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-ember-bg-tertiary rounded-full flex items-center justify-center mb-4 shadow-soft"><Medal className="h-8 w-8 text-ember-text-muted" /></div><div className="text-base font-semibold text-ember-text-primary mb-2">No leaderboard data available</div><div className="text-ember-text-secondary text-sm">Leaderboard will appear here once data is loaded.</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-ember-bg-secondary rounded-xl border border-ember-border overflow-hidden mb-8 shadow-medium">
            <div className="text-center py-12">
              <Medal className="h-16 w-16 text-ember-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ember-text-primary mb-2">College Rankings Coming Soon</h3>
              <p className="text-ember-text-secondary text-sm">College rankings will be available here.</p>
            </div>
          </div>
        )}

        {/* Your Rank Card - Enhanced with Ember Flow theme */}
        <div className="mt-12 bg-gradient-to-r from-primary-600/15 to-secondary-600/15 backdrop-blur-sm rounded-2xl border border-primary-600/25 p-8 shadow-glow relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-secondary-600/5 animate-pulse"></div>

          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mr-4 shadow-glow">
                <Medal className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-2xl font-bold text-ember-text-primary">Your Current Ranking</h3>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 h-20 w-20 rounded-full flex items-center justify-center border border-primary-600/30 shadow-glow">
                  <span className="text-3xl font-bold text-primary-300">#{currentUserRank?.rank || 1}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 text-center md:text-left">
                  <div>
                    <div className="text-sm text-ember-text-secondary font-medium mb-1">Your Rank</div>
                    <div className="text-4xl font-bold text-ember-text-primary">#{currentUserRank?.rank || 1}</div>
                  </div>
                  <div>
                    <div className="text-sm text-ember-text-secondary font-medium mb-1">Points</div>
                    <div className="text-4xl font-bold text-success-400">{currentUserRank?.points?.toLocaleString() || '1,000'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-ember-text-secondary font-medium mb-1">Problems Solved</div>
                    <div className="text-4xl font-bold text-primary-400">{currentUserRank?.problemsSolved || '0'}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile/me')}
                  className="border-ember-border text-ember-text-primary hover:border-primary-600/50 hover:text-primary-300 hover:bg-primary-600/10 transition-all duration-300"
                >
                  View Your Profile
                </Button>
                <Button
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white border-0 shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300"
                  onClick={() => navigate('/problems')}
                >
                  Improve Rank
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;