import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Share2, Award, Code, Activity, Bookmark, MapPin, Briefcase, Calendar, ExternalLink, Linkedin, Globe, TrendingUp, Users, Star } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
const Profile: React.FC = () => {
  const {
    userId
  } = useParams<{
    userId: string;
  }>();
  const [activeTab, setActiveTab] = useState('posts');
  // Mock user data
  const user = {
    id: userId,
    name: 'Alex Johnson',
    username: 'alexj',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    bio: 'Software Engineer | Problem Solver | Competitive Programmer',
    college: 'Stanford University',
    location: 'Palo Alto, CA',
    work: 'Software Engineer at Google',
    joinedDate: 'June 2021',
    website: 'https://alexjohnson.dev',
    github: 'alexjohnson',
    linkedin: 'alexjohnson',
    stats: {
      rank: 42,
      points: 7845,
      problemsSolved: 284,
      contributions: 156,
      followers: 328,
      following: 142
    },
    badges: [{
      name: 'Algorithm Master',
      icon: 'award',
      color: 'blue',
      description: 'Solved 100+ algorithm problems'
    }, {
      name: 'Top 5% Coder',
      icon: 'trending-up',
      color: 'purple',
      description: 'Ranked in the top 5% globally'
    }, {
      name: 'Challenge Champion',
      icon: 'trophy',
      color: 'cyan',
      description: 'Won 10+ coding challenges'
    }],
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Algorithms', 'Data Structures', 'System Design', 'Machine Learning']
  };
  const posts = [{
    type: 'post',
    author: {
      name: user.name,
      avatar: user.avatar,
      college: user.college,
      username: user.username
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
    time: '2 days ago'
  }, {
    type: 'post',
    author: {
      name: user.name,
      avatar: user.avatar,
      college: user.college,
      username: user.username
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
    time: '1 week ago'
  }];
  const solutions = [{
    id: 1,
    problem: {
      title: 'Two Sum',
      difficulty: 'Easy',
      link: '/problem/two-sum'
    },
    language: 'JavaScript',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    likes: 86,
    date: '3 days ago',
    code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
  }, {
    id: 2,
    problem: {
      title: 'Merge Intervals',
      difficulty: 'Medium',
      link: '/problem/merge-intervals'
    },
    language: 'JavaScript',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    likes: 124,
    date: '1 week ago',
    code: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  // Sort intervals by start time
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const currentInterval = intervals[i];
    const lastResult = result[result.length - 1];
    // If current interval overlaps with the last result interval
    if (currentInterval[0] <= lastResult[1]) {
      // Merge the intervals
      lastResult[1] = Math.max(lastResult[1], currentInterval[1]);
    } else {
      // Add current interval to result
      result.push(currentInterval);
    }
  }
  return result;
}`
  }];
  const achievements = [{
    id: 1,
    title: 'Stanford vs MIT Challenge Winner',
    description: 'First place in the Algorithm Speedrun Challenge',
    date: 'May 15, 2023',
    points: 3000,
    icon: 'trophy'
  }, {
    id: 2,
    title: '100 Day Coding Streak',
    description: 'Solved at least one problem every day for 100 days',
    date: 'April 2, 2023',
    points: 1000,
    icon: 'activity'
  }, {
    id: 3,
    title: 'Top Contributor',
    description: 'One of the most active contributors in the Stanford community',
    date: 'March 10, 2023',
    points: 1500,
    icon: 'star'
  }];
  return <div className="max-w-screen-xl mx-auto">
      {/* Cover Image and Profile Info */}
      <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden mb-6">
        <div className="h-48 bg-cover bg-center" style={{
        backgroundImage: `url(${user.coverImage})`
      }}></div>
        <div className="p-6 relative">
          <div className="absolute -top-16 left-6 bg-dark-600 rounded-xl p-2 border-4 border-dark-600">
            <Avatar src={user.avatar} size="lg" status="online" />
          </div>
          <div className="ml-36 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <div className="ml-3">
                  {user.badges.slice(0, 1).map((badge, index) => <Badge key={index} text={badge.name} color="purple" size="md" />)}
                </div>
              </div>
              <p className="text-dark-300">@{user.username}</p>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-2">
              <Button variant="outline" leftIcon={<MessageSquare className="h-4 w-4" />}>
                Message
              </Button>
              <Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>
                Follow
              </Button>
              <Button variant="ghost" leftIcon={<Share2 className="h-4 w-4" />}>
                Share
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <p className="mb-4">{user.bio}</p>
            <div className="flex flex-wrap gap-y-2">
              {user.college && <div className="flex items-center text-dark-300 mr-6">
                  <Award className="h-4 w-4 mr-2" />
                  <span>{user.college}</span>
                </div>}
              {user.location && <div className="flex items-center text-dark-300 mr-6">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{user.location}</span>
                </div>}
              {user.work && <div className="flex items-center text-dark-300 mr-6">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>{user.work}</span>
                </div>}
              {user.joinedDate && <div className="flex items-center text-dark-300 mr-6">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Joined {user.joinedDate}</span>
                </div>}
              {user.website && <div className="flex items-center text-dark-300 mr-6">
                  <Globe className="h-4 w-4 mr-2" />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue">
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>}
              {user.github && <div className="flex items-center text-dark-300 mr-6">
                  <div className="h-4 w-4 mr-2" />
                  <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue">
                    {user.github}
                  </a>
                </div>}
              {user.linkedin && <div className="flex items-center text-dark-300 mr-6">
                  <Linkedin className="h-4 w-4 mr-2" />
                  <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue">
                    {user.linkedin}
                  </a>
                </div>}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-dark-500">
            <div className="text-center">
              <div className="text-dark-300 text-sm">Rank</div>
              <div className="text-xl font-bold">#{user.stats.rank}</div>
            </div>
            <div className="text-center">
              <div className="text-dark-300 text-sm">Points</div>
              <div className="text-xl font-bold">
                {user.stats.points.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-dark-300 text-sm">Problems</div>
              <div className="text-xl font-bold">
                {user.stats.problemsSolved}
              </div>
            </div>
            <div className="text-center">
              <div className="text-dark-300 text-sm">Contributions</div>
              <div className="text-xl font-bold">
                {user.stats.contributions}
              </div>
            </div>
            <div className="text-center">
              <div className="text-dark-300 text-sm">Followers</div>
              <div className="text-xl font-bold">{user.stats.followers}</div>
            </div>
            <div className="text-center">
              <div className="text-dark-300 text-sm">Following</div>
              <div className="text-xl font-bold">{user.stats.following}</div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-t border-dark-500 overflow-x-auto">
          <button onClick={() => setActiveTab('posts')} className={`py-3 px-6 transition-colors ${activeTab === 'posts' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            Posts
          </button>
          <button onClick={() => setActiveTab('solutions')} className={`py-3 px-6 transition-colors ${activeTab === 'solutions' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            Solutions
          </button>
          <button onClick={() => setActiveTab('achievements')} className={`py-3 px-6 transition-colors ${activeTab === 'achievements' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            Achievements
          </button>
          <button onClick={() => setActiveTab('badges')} className={`py-3 px-6 transition-colors ${activeTab === 'badges' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
            Badges
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'posts' && <div className="space-y-6">
              {posts.map((post, index) => <Card key={index} {...post} />)}
            </div>}
          {activeTab === 'solutions' && <div className="space-y-6">
              {solutions.map(solution => <div key={solution.id} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
                  <div className="p-4 border-b border-dark-500">
                    <div className="flex justify-between">
                      <div>
                        <a href={solution.problem.link} className="font-medium hover:text-primary-blue">
                          {solution.problem.title}
                        </a>
                        <div className="flex items-center mt-1">
                          <Badge text={solution.problem.difficulty} color={solution.problem.difficulty === 'Easy' ? 'blue' : solution.problem.difficulty === 'Medium' ? 'purple' : 'cyan'} className="mr-2" />
                          <span className="text-dark-300 text-sm">
                            {solution.date}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="text-dark-300">Time: </span>
                          <span className="font-mono">
                            {solution.timeComplexity}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-dark-300">Space: </span>
                          <span className="font-mono">
                            {solution.spaceComplexity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-dark-700 rounded-md p-4 mb-4 overflow-x-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary-blue text-xs">
                          {solution.language}
                        </span>
                        <button className="text-dark-300 text-xs hover:text-dark-100">
                          Copy
                        </button>
                      </div>
                      <pre className="text-dark-200 text-sm font-mono">
                        <code>{solution.code}</code>
                      </pre>
                    </div>
                    <div className="flex justify-between">
                      <button className="flex items-center text-dark-300 hover:text-primary-blue transition-colors">
                        <ThumbsUp className="h-4 w-4 mr-1.5" />
                        <span className="text-sm">{solution.likes}</span>
                      </button>
                      <div className="flex space-x-4">
                        <button className="text-dark-300 hover:text-primary-blue transition-colors">
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button className="text-dark-300 hover:text-primary-blue transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button className="text-dark-300 hover:text-primary-blue transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>}
          {activeTab === 'achievements' && <div className="space-y-6">
              {achievements.map(achievement => <div key={achievement.id} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
                  <div className="p-6 flex">
                    <div className="bg-primary-blue bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mr-4">
                      {achievement.icon === 'trophy' && <Award className="h-6 w-6 text-primary-blue" />}
                      {achievement.icon === 'activity' && <Activity className="h-6 w-6 text-primary-blue" />}
                      {achievement.icon === 'star' && <Star className="h-6 w-6 text-primary-blue" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-dark-300">
                            {achievement.description}
                          </p>
                        </div>
                        <div className="bg-dark-500 rounded-full px-3 py-1 text-sm">
                          +{achievement.points} points
                        </div>
                      </div>
                      <div className="mt-2 text-dark-300 text-sm">
                        {achievement.date}
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>}
          {activeTab === 'badges' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.badges.map((badge, index) => <div key={index} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
                  <div className="p-6 flex items-center">
                    <div className={`bg-${badge.color === 'blue' ? 'primary-blue' : badge.color === 'purple' ? 'primary-purple' : 'primary-cyan'} bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mr-4`}>
                      {badge.icon === 'award' && <Award className={`h-6 w-6 text-${badge.color === 'blue' ? 'primary-blue' : badge.color === 'purple' ? 'primary-purple' : 'primary-cyan'}`} />}
                      {badge.icon === 'trending-up' && <TrendingUp className={`h-6 w-6 text-${badge.color === 'blue' ? 'primary-blue' : badge.color === 'purple' ? 'primary-purple' : 'primary-cyan'}`} />}
                      {badge.icon === 'trophy' && <Award className={`h-6 w-6 text-${badge.color === 'blue' ? 'primary-blue' : badge.color === 'purple' ? 'primary-purple' : 'primary-cyan'}`} />}
                    </div>
                    <div>
                      <h3 className="font-medium">{badge.name}</h3>
                      <p className="text-dark-300 text-sm">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>
        {/* Sidebar */}
        <div className="md:w-80 space-y-6">
          {/* Skills */}
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="p-4 border-b border-dark-500">
              <h3 className="font-medium">Skills</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => <Badge key={index} text={skill} color={index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'purple' : 'cyan'} />)}
              </div>
            </div>
          </div>
          {/* Recent Activity */}
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="p-4 border-b border-dark-500">
              <h3 className="font-medium">Recent Activity</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-3 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary-blue"></div>
                  </div>
                  <div>
                    <p className="text-sm">
                      Solved{' '}
                      <span className="text-primary-blue">Merge Intervals</span>{' '}
                      problem
                    </p>
                    <p className="text-dark-300 text-xs">2 days ago</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-3 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary-blue"></div>
                  </div>
                  <div>
                    <p className="text-sm">
                      Joined{' '}
                      <span className="text-primary-blue">
                        Weekly Coding Contest #42
                      </span>
                    </p>
                    <p className="text-dark-300 text-xs">3 days ago</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-3 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary-blue"></div>
                  </div>
                  <div>
                    <p className="text-sm">
                      Earned{' '}
                      <span className="text-primary-blue">
                        Algorithm Master
                      </span>{' '}
                      badge
                    </p>
                    <p className="text-dark-300 text-xs">1 week ago</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-3 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary-blue"></div>
                  </div>
                  <div>
                    <p className="text-sm">
                      Won{' '}
                      <span className="text-primary-blue">
                        Stanford vs MIT Challenge
                      </span>
                    </p>
                    <p className="text-dark-300 text-xs">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Profile;