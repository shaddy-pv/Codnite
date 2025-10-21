import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, Medal } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { leaderboardApi, collegesApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('allindia'); // Default to lowercase id
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('all');
  const { handleApiError } = useToast();

  // Handle profile navigation
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      // Pass actual filters
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
      // Colleges loaded but not stored in state
    } catch (error: any) {
      handleApiError(error, 'Failed to load colleges');
    }
  };

  // Load college leaderboard
  const loadCollegeLeaderboard = async (collegeId: string) => {
    try {
      setIsLoading(true);
      const response = await leaderboardApi.getCollegeLeaderboard(collegeId, 20); // Pass ID and limit
      setCollegeLeaderboard(response.leaderboard);
    } catch (error: any) {
      handleApiError(error, 'Failed to load college leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLeaderboard(); // Load initial leaderboard
    loadColleges();    // Load colleges list (if needed for filtering later)
  }, []);

  // Reload when filters change
  useEffect(() => {
    // Use lowercase tab IDs consistently
    if (activeTab !== 'collegerankings' && activeTab !== 'college') {
      loadLeaderboard(); // Reload user leaderboard
    } else if (activeTab === 'college' && selectedCollege) {
      loadCollegeLeaderboard(selectedCollege); // Load specific college user leaderboard
    } else if (activeTab === 'collegerankings') {
      // Assuming you have a function to load the college rankings leaderboard
      // loadCollegeRankingsLeaderboard(); // Call function to load college rankings
      console.log("Need to load College Rankings Leaderboard"); // Placeholder
    }
  }, [activeTab, selectedCollege, timeframe]);


  return (
    // Use dark theme background
    <div className="min-h-screen bg-dark-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-dark-400">See where you stand among the best coders</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-dark-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Search users or colleges..."
              />
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline" // Removed className override
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
              <select
                className="bg-dark-800/50 border border-dark-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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

        {/* Enhanced Tabs - Use consistent lowercase IDs */}
        <div className="flex border-b border-dark-700/50 mb-8 overflow-x-auto">
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
              className={`py-4 px-6 whitespace-nowrap border-b-2 transition-all duration-200 font-medium ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-400' // Should be orange
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Table (User or College Rankings) */}
        {activeTab !== 'collegerankings' ? (
          // --- User Leaderboard Table ---
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-700/50 border-b border-dark-600/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">College</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Problems</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Badges</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {leaderboardData?.length > 0 ? (
                    leaderboardData.map((user, index) => {
                      const rankChange = (user.previousRank || 0) - (user.rank || 0);
                      return (
                        <tr key={user.id} className="hover:bg-dark-700/30 transition-all duration-200 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`font-bold text-lg ${ user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-300' : user.rank === 3 ? 'text-amber-600' : 'text-dark-300'}`}>
                                #{user.rank || index + 1}
                              </span>
                              {rankChange > 0 && <TrendingUp className="h-4 w-4 text-green-400 ml-2" />}
                              {rankChange < 0 && <TrendingDown className="h-4 w-4 text-red-400 ml-2" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar src={user.avatarUrl || '/default-avatar.svg'} alt={user.name || 'Unknown User'} size="md" />
                              <div className="ml-4">
                                <div className="font-semibold text-white">{user.name || 'Unknown User'}</div>
                                <div className="text-dark-400 text-sm">@{user.username || 'unknown'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-dark-300">{user.college?.name || user.collegeName || 'No College'}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-primary-400">{(user.points || 0).toLocaleString()}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-dark-300">{user.stats?.problemAcceptedCount || user.acceptedCount || 0}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {user.badges?.length > 0 ? user.badges.slice(0, 3).map((badge: any, index: number) => (
                                <Badge key={index} text={badge} color={index === 0 ? 'purple' : index === 1 ? 'blue' : 'cyan'} />
                              )) : <span className="text-dark-500 text-sm">No badges</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm" onClick={() => handleProfileClick(user.id)}>Profile</Button> {/* Removed className override */}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mb-4"><Medal className="h-8 w-8 text-dark-400" /></div><div className="text-lg font-semibold text-white mb-2">No leaderboard data available</div><div className="text-dark-400 text-sm">Leaderboard will appear here once data is loaded.</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-dark-700/30 border-t border-dark-600/50 flex justify-between items-center">
              <div className="text-dark-400 text-sm">Showing {leaderboardData?.length || 0} users</div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Previous</Button> {/* Removed className override */}
                <Button variant="outline" size="sm">Next</Button> {/* Removed className override */}
              </div>
            </div>
          </div>
        ) : (
          // --- College Rankings Table ---
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-700/50 border-b border-dark-600/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">College</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">Top Performer</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {collegeLeaderboard?.length > 0 ? (
                    collegeLeaderboard.map((college, index) => {
                      const rankChange = (college.previousRank || 0) - (college.rank || 0);
                      return (
                        <tr key={college.id} className="hover:bg-dark-700/30 transition-all duration-200 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`font-bold text-lg ${ college.rank === 1 ? 'text-yellow-400' : college.rank === 2 ? 'text-gray-300' : college.rank === 3 ? 'text-amber-600' : 'text-dark-300'}`}>
                                #{college.rank || index + 1}
                              </span>
                              {rankChange > 0 && <TrendingUp className="h-4 w-4 text-green-400 ml-2" />}
                              {rankChange < 0 && <TrendingDown className="h-4 w-4 text-red-400 ml-2" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img src={college.logo || '/default-college-logo.svg'} alt={college.name || 'College'} className="h-10 w-10 object-contain rounded-lg bg-dark-700/50 p-1" />
                              <div className="ml-4">
                                <div className="font-semibold text-white">{college.name || 'Unknown College'}</div>
                                <div className="text-dark-400 text-sm">{college.shortName || college.short_name || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-primary-400">{(college.points || 0).toLocaleString()}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-dark-300">{(college.members || college.memberCount || 0).toLocaleString()}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-dark-300">{college.topPerformer || 'N/A'}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm">View</Button> {/* Removed className override */}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mb-4"><Medal className="h-8 w-8 text-dark-400" /></div><div className="text-lg font-semibold text-white mb-2">No college data available</div><div className="text-dark-400 text-sm">College rankings will appear here once data is loaded.</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-dark-700/30 border-t border-dark-600/50 flex justify-between items-center">
              <div className="text-dark-400 text-sm">Showing {collegeLeaderboard?.length || 0} colleges</div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Previous</Button> {/* Removed className override */}
                <Button variant="outline" size="sm">Next</Button> {/* Removed className override */}
              </div>
            </div>
          </div>
        )}

        {/* Your Rank Card */}
        <div className="mt-8 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 backdrop-blur-sm rounded-2xl border border-primary-600/30 p-8">
          <div className="flex items-center mb-6">
            {/* Use theme colors for the gradient */}
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mr-4">
              <Medal className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Your Current Ranking</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-primary-600/20 h-16 w-16 rounded-full flex items-center justify-center mr-6">
                <span className="text-2xl font-bold text-primary-400">#42</span> {/* Should be orange */}
              </div>
              <div className="mr-8">
                <div className="text-sm text-dark-400">Your Rank</div>
                <div className="text-3xl font-bold text-white">#42</div>
              </div>
              <div className="mr-8">
                <div className="text-sm text-dark-400">Points</div>
                <div className="text-3xl font-bold text-green-400">7,845</div>
              </div>
              <div>
                <div className="text-sm text-dark-400">Problems Solved</div>
                <div className="text-3xl font-bold text-primary-400">284</div> {/* Should be orange */}
              </div>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" // Removed className override
                onClick={() => navigate('/profile/me')}
              >
                View Your Profile
              </Button>
              <Button 
                // Keep this className for the gradient effect using theme colors
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white border-0"
                onClick={() => navigate('/problems')}
              >
                Improve Rank
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;