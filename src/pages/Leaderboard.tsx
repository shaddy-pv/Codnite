import React, { useState } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, Medal } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('allIndia');
  const leaderboardData = [{
    id: 1,
    name: 'Emily Chen',
    username: 'emilyc',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'MIT',
    rank: 1,
    previousRank: 1,
    points: 9842,
    problemsSolved: 458,
    badges: ['Top Coder', 'Challenge Champion']
  }, {
    id: 2,
    name: 'Alex Johnson',
    username: 'alexj',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Stanford',
    rank: 2,
    previousRank: 3,
    points: 9756,
    problemsSolved: 442,
    badges: ['Algorithm Master']
  }, {
    id: 3,
    name: 'Sophia Lee',
    username: 'sophial',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Harvard',
    rank: 3,
    previousRank: 2,
    points: 9584,
    problemsSolved: 435,
    badges: ['Problem Solver']
  }, {
    id: 4,
    name: 'Michael Wang',
    username: 'michaelw',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Caltech',
    rank: 4,
    previousRank: 4,
    points: 9247,
    problemsSolved: 421,
    badges: ['Data Structure Expert']
  }, {
    id: 5,
    name: 'Jessica Kim',
    username: 'jessicak',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Princeton',
    rank: 5,
    previousRank: 6,
    points: 9102,
    problemsSolved: 415,
    badges: ['Dynamic Programming Pro']
  }, {
    id: 6,
    name: 'David Smith',
    username: 'davids',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'UC Berkeley',
    rank: 6,
    previousRank: 5,
    points: 8975,
    problemsSolved: 408,
    badges: ['Graph Theory Expert']
  }, {
    id: 7,
    name: 'Olivia Martinez',
    username: 'oliviam',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'UCLA',
    rank: 7,
    previousRank: 7,
    points: 8842,
    problemsSolved: 402,
    badges: ['Frontend Wizard']
  }];
  const collegeLeaderboard = [{
    id: 1,
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png',
    rank: 1,
    previousRank: 1,
    points: 58942,
    members: 1248,
    topPerformer: 'Emily Chen'
  }, {
    id: 2,
    name: 'Stanford University',
    shortName: 'Stanford',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png',
    rank: 2,
    previousRank: 2,
    points: 57584,
    members: 1142,
    topPerformer: 'Alex Johnson'
  }, {
    id: 3,
    name: 'Harvard University',
    shortName: 'Harvard',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Harvard_Crimson_logo.svg/1200px-Harvard_Crimson_logo.svg.png',
    rank: 3,
    previousRank: 4,
    points: 54298,
    members: 1056,
    topPerformer: 'Sophia Lee'
  }];
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
                {leaderboardData.map(user => {
              const rankChange = user.previousRank - user.rank;
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
                          <Avatar src={user.avatar} size="sm" />
                          <div className="ml-3">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-dark-300 text-sm">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.college}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {user.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.problemsSolved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.badges.map((badge, index) => <Badge key={index} text={badge} color={index === 0 ? 'purple' : 'blue'} />)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm">
                          Profile
                        </Button>
                      </td>
                    </tr>;
            })}
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
                {collegeLeaderboard.map(college => {
              const rankChange = college.previousRank - college.rank;
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
                          <img src={college.logo} alt={college.name} className="h-8 w-8 object-contain" />
                          <div className="ml-3">
                            <div className="font-medium">{college.name}</div>
                            <div className="text-dark-300 text-sm">
                              {college.shortName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {college.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {college.members.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {college.topPerformer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />} size="sm">
                          View
                        </Button>
                      </td>
                    </tr>;
            })}
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