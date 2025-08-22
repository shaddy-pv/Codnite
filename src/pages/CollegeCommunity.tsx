import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Award, List, TrendingUp } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
const CollegeCommunity: React.FC = () => {
  const {
    collegeId
  } = useParams<{
    collegeId: string;
  }>();
  const [activeTab, setActiveTab] = useState('feed');
  // Mock data
  const college = {
    id: collegeId,
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png',
    location: 'Cambridge, MA',
    rank: 1,
    members: 1248,
    challenges: 28,
    wins: 22
  };
  const topMembers = [{
    id: 1,
    name: 'Emily Chen',
    username: 'emilyc',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    rank: 1,
    points: 8924,
    badges: ['Top Coder', 'Challenge Champion']
  }, {
    id: 2,
    name: 'James Wilson',
    username: 'jamesw',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    rank: 2,
    points: 8756,
    badges: ['Algorithm Master']
  }, {
    id: 3,
    name: 'Sarah Miller',
    username: 'sarahm',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    rank: 3,
    points: 7982,
    badges: ['Problem Solver']
  }];
  const feedItems = [{
    type: 'post',
    author: {
      name: 'Emily Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
      college: 'MIT',
      username: 'emilyc'
    },
    content: {
      text: 'Just solved the MIT Challenge of the Week in record time! Check out my solution:',
      code: 'function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) {\n    return findMedianSortedArrays(nums2, nums1);\n  }\n  \n  const x = nums1.length;\n  const y = nums2.length;\n  let low = 0;\n  let high = x;\n  \n  while (low <= high) {\n    const partitionX = Math.floor((low + high) / 2);\n    const partitionY = Math.floor((x + y + 1) / 2) - partitionX;\n    \n    const maxX = partitionX === 0 ? Number.NEGATIVE_INFINITY : nums1[partitionX - 1];\n    const maxY = partitionY === 0 ? Number.NEGATIVE_INFINITY : nums2[partitionY - 1];\n    \n    const minX = partitionX === x ? Number.POSITIVE_INFINITY : nums1[partitionX];\n    const minY = partitionY === y ? Number.POSITIVE_INFINITY : nums2[partitionY];\n    \n    if (maxX <= minY && maxY <= minX) {\n      const lowMax = Math.max(maxX, maxY);\n      if ((x + y) % 2 === 1) {\n        return lowMax;\n      }\n      return (lowMax + Math.min(minX, minY)) / 2;\n    } else if (maxX > minY) {\n      high = partitionX - 1;\n    } else {\n      low = partitionX + 1;\n    }\n  }\n}',
      language: 'JavaScript'
    },
    tags: ['MITChallenge', 'MedianOfArrays', 'BinarySearch'],
    stats: {
      likes: 187,
      comments: 42
    },
    time: '1 hour ago'
  }];
  const upcomingChallenges = [{
    id: 1,
    title: 'MIT vs Stanford: Algorithm Speedrun',
    description: 'Solve 5 algorithm problems in the shortest time',
    date: 'Tomorrow, 3:00 PM',
    participants: 124,
    prize: '3000 points'
  }, {
    id: 2,
    title: 'MIT vs Harvard: System Design Challenge',
    description: 'Design a scalable e-commerce backend',
    date: 'Saturday, 2:00 PM',
    participants: 98,
    prize: '2500 points'
  }];
  return <div className="max-w-screen-xl mx-auto">
      {/* College Banner */}
      <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-primary-blue to-primary-purple"></div>
        <div className="p-6 relative">
          <div className="absolute -top-12 left-6 bg-dark-600 rounded-xl p-2 border-4 border-dark-600">
            <img src={college.logo} alt={college.name} className="h-16 w-16 object-contain" />
          </div>
          <div className="ml-24">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{college.name}</h1>
                <p className="text-dark-300">{college.location}</p>
              </div>
              <div className="bg-dark-500 rounded-full px-4 py-1.5 flex items-center">
                <TrendingUp className="h-4 w-4 text-primary-blue mr-1.5" />
                <span className="font-medium">Rank #{college.rank}</span>
              </div>
            </div>
            <div className="flex mt-4 space-x-6">
              <div>
                <span className="text-dark-300 text-sm">Members</span>
                <p className="font-medium">{college.members}</p>
              </div>
              <div>
                <span className="text-dark-300 text-sm">Challenges</span>
                <p className="font-medium">{college.challenges}</p>
              </div>
              <div>
                <span className="text-dark-300 text-sm">Wins</span>
                <p className="font-medium">{college.wins}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-t border-dark-500">
          <button onClick={() => setActiveTab('feed')} className={`flex items-center py-3 px-6 transition-colors ${activeTab === 'feed' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            <List className="h-4 w-4 mr-2" />
            <span>Feed</span>
          </button>
          <button onClick={() => setActiveTab('challenges')} className={`flex items-center py-3 px-6 transition-colors ${activeTab === 'challenges' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            <Award className="h-4 w-4 mr-2" />
            <span>Challenges</span>
          </button>
          <button onClick={() => setActiveTab('members')} className={`flex items-center py-3 px-6 transition-colors ${activeTab === 'members' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            <Users className="h-4 w-4 mr-2" />
            <span>Members</span>
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'feed' && <div className="space-y-6">
              {feedItems.map((item, index) => <Card key={index} {...item} />)}
            </div>}
          {activeTab === 'challenges' && <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">Upcoming Challenges</h2>
              {upcomingChallenges.map(challenge => <div key={challenge.id} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
                  <div className="p-4 border-b border-dark-500">
                    <h3 className="font-medium">{challenge.title}</h3>
                    <p className="text-dark-300 text-sm">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between mb-4">
                      <div>
                        <span className="text-dark-300 text-xs">Date</span>
                        <p className="text-sm">{challenge.date}</p>
                      </div>
                      <div>
                        <span className="text-dark-300 text-xs">
                          Participants
                        </span>
                        <p className="text-sm">{challenge.participants}</p>
                      </div>
                      <div>
                        <span className="text-dark-300 text-xs">Prize</span>
                        <p className="text-sm">{challenge.prize}</p>
                      </div>
                    </div>
                    <Button variant="primary" fullWidth>
                      Register
                    </Button>
                  </div>
                </div>)}
              <h2 className="text-lg font-medium mt-8 mb-4">Past Challenges</h2>
              <div className="bg-dark-600 rounded-xl border border-dark-500 p-4 text-center">
                <p className="text-dark-300">No past challenges found</p>
              </div>
            </div>}
          {activeTab === 'members' && <div>
              <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden mb-6">
                <div className="p-4 border-b border-dark-500">
                  <h2 className="font-medium">Top Members</h2>
                </div>
                <div className="divide-y divide-dark-500">
                  {topMembers.map(member => <div key={member.id} className="p-4 hover:bg-dark-500">
                      <div className="flex items-center">
                        <div className="w-8 text-center font-medium">
                          #{member.rank}
                        </div>
                        <Avatar src={member.avatar} size="md" className="ml-2" />
                        <div className="ml-3 flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="flex items-center text-sm text-dark-300">
                            <span>@{member.username}</span>
                            <span className="mx-1">•</span>
                            <span>{member.points} points</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>)}
                </div>
              </div>
              <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
                <div className="p-4 border-b border-dark-500">
                  <h2 className="font-medium">All Members</h2>
                </div>
                <div className="p-4">
                  {/* Member search and list would go here */}
                  <p className="text-dark-300 text-center">
                    Showing 50 of {college.members} members
                  </p>
                </div>
              </div>
            </div>}
        </div>
        {/* Sidebar */}
        <div className="md:w-80">
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="p-4 border-b border-dark-500">
              <h3 className="font-medium">College Stats</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300 text-sm">
                      All-time points
                    </span>
                    <span className="font-medium">285,492</span>
                  </div>
                  <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-blue to-primary-purple w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300 text-sm">
                      Challenge win rate
                    </span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-blue to-primary-purple w-4/5"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300 text-sm">
                      Problems solved
                    </span>
                    <span className="font-medium">12,458</span>
                  </div>
                  <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-blue to-primary-purple w-2/3"></div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" fullWidth>
                    View detailed stats
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default CollegeCommunity;