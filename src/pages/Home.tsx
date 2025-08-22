import React, { useState } from 'react';
import { Flame, Clock, UserPlus, Filter, Code, PenTool } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const feedItems = [{
    type: 'post',
    author: {
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
      college: 'MIT',
      username: 'alexj'
    },
    content: {
      text: "Just solved this tricky dynamic programming problem. Here's my approach:",
      code: 'function coinChange(coins, amount) {\n  const dp = Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  \n  for (const coin of coins) {\n    for (let i = coin; i <= amount; i++) {\n      dp[i] = Math.min(dp[i], dp[i - coin] + 1);\n    }\n  }\n  \n  return dp[amount] === Infinity ? -1 : dp[amount];\n}',
      language: 'JavaScript'
    },
    tags: ['DynamicProgramming', 'Algorithms', 'JavaScript'],
    stats: {
      likes: 142,
      comments: 38
    },
    time: '2 hours ago'
  }, {
    type: 'problem',
    author: {
      name: 'Sophia Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
      college: 'Stanford',
      username: 'sophiac'
    },
    content: {
      text: 'Can you optimize this sorting algorithm to improve its time complexity?',
      code: 'function bubbleSort(arr) {\n  const n = arr.length;\n  \n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        // swap\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  \n  return arr;\n}',
      language: 'JavaScript'
    },
    tags: ['Sorting', 'Optimization', 'Challenge'],
    stats: {
      likes: 89,
      comments: 24
    },
    time: '5 hours ago'
  }, {
    type: 'post',
    author: {
      name: 'Marcus Lee',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
      college: 'UC Berkeley',
      username: 'marcusl'
    },
    content: {
      text: 'Just completed my first tech interview with Google! Here are some tips for anyone preparing:',
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    },
    tags: ['Interview', 'Career', 'Google'],
    stats: {
      likes: 215,
      comments: 42
    },
    time: '1 day ago'
  }];
  const challengeData = {
    title: 'Weekly College Challenge',
    description: 'MIT vs Stanford: Algorithm Speedrun',
    timeRemaining: '2d 4h remaining',
    participants: 128,
    prize: '5000 points + Recruiter Visibility'
  };
  const suggestedUsers = [{
    name: 'Emma Watson',
    username: 'emmaw',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Harvard',
    rank: '#3 in Algorithms'
  }, {
    name: 'David Kim',
    username: 'davidk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    college: 'Princeton',
    rank: '#1 in Data Structures'
  }];
  return <div className="max-w-screen-xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex items-center mb-6 border-b border-dark-600">
            <button onClick={() => setActiveTab('trending')} className={`flex items-center py-3 px-4 border-b-2 transition-colors ${activeTab === 'trending' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
              <Flame className="h-4 w-4 mr-2" />
              <span>Trending</span>
            </button>
            <button onClick={() => setActiveTab('newest')} className={`flex items-center py-3 px-4 border-b-2 transition-colors ${activeTab === 'newest' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
              <Clock className="h-4 w-4 mr-2" />
              <span>Newest</span>
            </button>
            <button onClick={() => setActiveTab('following')} className={`flex items-center py-3 px-4 border-b-2 transition-colors ${activeTab === 'following' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Following</span>
            </button>
            <div className="ml-auto flex items-center">
              <button className="flex items-center text-dark-300 hover:text-dark-100 transition-colors">
                <Filter className="h-4 w-4 mr-1" />
                <span>Filter</span>
              </button>
            </div>
          </div>
          {/* Create Post */}
          <div className="bg-dark-600 rounded-xl p-4 mb-6 border border-dark-500">
            <div className="flex gap-4">
              <Button variant="outline" leftIcon={<PenTool className="h-4 w-4" />} fullWidth>
                Write a post
              </Button>
              <Button variant="outline" leftIcon={<Code className="h-4 w-4" />} fullWidth>
                Share code
              </Button>
            </div>
          </div>
          {/* Feed Items */}
          <div className="space-y-6">
            {feedItems.map((item, index) => <Card key={index} {...item} />)}
          </div>
        </div>
        {/* Sidebar */}
        <div className="md:w-80 space-y-6">
          {/* Challenge Card */}
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-blue to-primary-purple p-4">
              <h3 className="text-white font-bold">Featured Challenge</h3>
            </div>
            <div className="p-4">
              <h4 className="font-medium mb-1">{challengeData.title}</h4>
              <p className="text-dark-300 text-sm mb-3">
                {challengeData.description}
              </p>
              <div className="flex justify-between text-sm mb-4">
                <div className="text-dark-300">
                  <span className="text-primary-blue">
                    {challengeData.timeRemaining}
                  </span>
                </div>
                <div className="text-dark-300">
                  <span className="text-primary-blue">
                    {challengeData.participants}
                  </span>{' '}
                  participants
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-dark-300 mb-1">Prize</div>
                <div className="text-sm font-medium">{challengeData.prize}</div>
              </div>
              <Button variant="primary" fullWidth>
                Join Challenge
              </Button>
            </div>
          </div>
          {/* Suggested Users */}
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="p-4 border-b border-dark-500">
              <h3 className="font-medium">Suggested Coders</h3>
            </div>
            <div className="p-2">
              {suggestedUsers.map((user, index) => <div key={index} className="p-2 hover:bg-dark-500 rounded-lg">
                  <div className="flex items-center">
                    <Avatar src={user.avatar} size="sm" />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-dark-300 text-xs">
                        {user.college} • {user.rank}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  </div>
                </div>)}
            </div>
          </div>
          {/* Trending Tags */}
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="p-4 border-b border-dark-500">
              <h3 className="font-medium">Trending Tags</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                <Badge text="DynamicProgramming" color="purple" />
                <Badge text="MachineLearning" color="blue" />
                <Badge text="React" color="cyan" />
                <Badge text="Algorithms" color="purple" />
                <Badge text="SystemDesign" color="blue" />
                <Badge text="Python" color="cyan" />
                <Badge text="JavaScript" color="purple" />
                <Badge text="FrontendDev" color="blue" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Home;