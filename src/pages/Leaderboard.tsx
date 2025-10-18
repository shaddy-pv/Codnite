import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, Medal } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { leaderboardApi, collegesApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('allIndia');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('all');
  const { handleApiError } = useToast();

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
      const response = await collegesApi.getColleges(1, 100);
      // Colleges loaded but not stored in state since we're not using them
    } catch (error: any) {
      handleApiError(error, 'Failed to load colleges');
    }
  };

  // Load college leaderboard
  const loadCollegeLeaderboard = async (collegeId: string) => {
    try {
      const response = await leaderboardApi.getCollegeLeaderboard(collegeId, 20);
      setCollegeLeaderboard(response.leaderboard);
    } catch (error: any) {
      handleApiError(error, 'Failed to load college leaderboard');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLeaderboard();
    loadColleges();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (activeTab === 'allIndia') {
      loadLeaderboard();
    } else if (activeTab === 'college' && selectedCollege) {
      loadCollegeLeaderboard(selectedCollege);
    }
  }, [activeTab, selectedCollege, timeframe]);

  return <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-dark-300">
          See where you stand among the best coders
        </p>
      </div>
      {/* Search and Filter */}
      <div className="bg-dark-600 rounded-xl border border-dark-500 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-dark-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue" placeholder="Search users or colleges..." />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filters
            </Button>
            <select className="bg-dark-700 border border-dark-500 rounded-lg px-4 py-2.5 text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue">
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="day">Today</option>
            </select>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-dark-500 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab('allIndia')} className={`py-3 px-6 whitespace-nowrap border-b-2 transition-colors ${activeTab === 'allIndia' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          All India
        </button>
        <button onClick={() => setActiveTab('state')} className={`py-3 px-6 whitespace-nowrap border-b-2 transition-colors ${activeTab === 'state' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          State
        </button>
        <button onClick={() => setActiveTab('city')} className={`py-3 px-6 whitespace-nowrap border-b-2 transition-colors ${activeTab === 'city' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          City
        </button>
        <button onClick={() => setActiveTab('college')} className={`py-3 px-6 whitespace-nowrap border-b-2 transition-colors ${activeTab === 'college' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          College
        </button>
        <button onClick={() => setActiveTab('colleges')} className={`py-3 px-6 whitespace-nowrap border-b-2 transition-colors ${activeTab === 'colleges' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          College Rankings
        </button>
      </div>
      {/* Leaderboard Table */}
      {activeTab !== 'colleges' ? <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Problems
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Badges
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-500">
                {leaderboardData && leaderboardData.length > 0 ? (
                  leaderboardData.map(user => {
                    const rankChange = (user.previousRank || 0) - (user.rank || 0);
                    return <tr key={user.id} className="hover:bg-dark-500">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`font-medium ${user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-amber-700' : ''}`}>
                            {user.rank}
                          </span>
                          {rankChange > 0 && <TrendingUp className="h-4 w-4 text-green-500 ml-2" />}
                          {rankChange < 0 && <TrendingDown className="h-4 w-4 text-red-500 ml-2" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar src={user.avatarUrl || '/default-avatar.svg'} size="sm" />
                          <div className="ml-3">
                            <div className="font-medium">{user.name || 'Unknown User'}</div>
                            <div className="text-dark-300 text-sm">
                              @{user.username || 'unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.college?.name || 'No College'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {(user.points || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.stats?.problemAcceptedCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.badges && user.badges.length > 0 ? (
                            user.badges.map((badge, index) => <Badge key={index} text={badge} color={index === 0 ? 'purple' : 'blue'} />)
                          ) : (
                            <span className="text-dark-400 text-sm">No badges</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm">
                          Profile
                        </Button>
                      </td>
                    </tr>;
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-dark-300">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-medium mb-2">No leaderboard data available</div>
                        <div className="text-sm">Leaderboard will appear here once data is loaded.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-dark-500 flex justify-between items-center">
            <div className="text-dark-300 text-sm">
              Showing 7 of 10,482 users
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div> : <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Top Performer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-500">
                {collegeLeaderboard && collegeLeaderboard.length > 0 ? (
                  collegeLeaderboard.map(college => {
                    const rankChange = (college.previousRank || 0) - (college.rank || 0);
                    return <tr key={college.id} className="hover:bg-dark-500">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`font-medium ${college.rank === 1 ? 'text-yellow-500' : college.rank === 2 ? 'text-gray-400' : college.rank === 3 ? 'text-amber-700' : ''}`}>
                            {college.rank}
                          </span>
                          {rankChange > 0 && <TrendingUp className="h-4 w-4 text-green-500 ml-2" />}
                          {rankChange < 0 && <TrendingDown className="h-4 w-4 text-red-500 ml-2" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img src={college.logo || '/default-college-logo.svg'} alt={college.name || 'College'} className="h-8 w-8 object-contain" />
                          <div className="ml-3">
                            <div className="font-medium">{college.name || 'Unknown College'}</div>
                            <div className="text-dark-300 text-sm">
                              {college.shortName || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {(college.points || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(college.members || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {college.topPerformer || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm">
                          View
                        </Button>
                      </td>
                    </tr>;
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-dark-300">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-medium mb-2">No college data available</div>
                        <div className="text-sm">College rankings will appear here once data is loaded.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-dark-500 flex justify-between items-center">
            <div className="text-dark-300 text-sm">
              Showing 3 of 248 colleges
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>}
      {/* Your Rank Card */}
      <div className="mt-6 bg-dark-600 rounded-xl border border-primary-blue border-opacity-30 p-6">
        <h3 className="font-medium mb-4">Your Current Ranking</h3>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-primary-blue bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mr-4">
              <Medal className="h-6 w-6 text-primary-blue" />
            </div>
            <div>
              <div className="text-sm text-dark-300">Your Rank</div>
              <div className="text-2xl font-bold">#42</div>
            </div>
            <div className="ml-6">
              <div className="text-sm text-dark-300">Points</div>
              <div className="text-2xl font-bold">7,845</div>
            </div>
            <div className="ml-6">
              <div className="text-sm text-dark-300">Problems Solved</div>
              <div className="text-2xl font-bold">284</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">View Your Profile</Button>
            <Button variant="primary">Improve Rank</Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Leaderboard;