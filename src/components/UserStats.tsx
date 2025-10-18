import React from 'react';
import { Trophy, Star, Code, Users, TrendingUp, Award } from 'lucide-react';

interface UserStatsProps {
  user: {
    id: string;
    points: number;
    collegeId?: string;
  };
  stats?: {
    rank?: number;
    problemsSolved?: number;
    contributions?: number;
    followers?: number;
    following?: number;
    badges?: number;
    achievements?: number;
  };
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const UserStats: React.FC<UserStatsProps> = ({ 
  user, 
  stats = {}, 
  className = '', 
  onFollowersClick, 
  onFollowingClick 
}) => {
  const defaultStats = {
    rank: 0,
    problemsSolved: 0,
    contributions: 0,
    followers: 0,
    following: 0,
    badges: 0,
    achievements: 0,
    ...stats
  };

  const statItems = [
    {
      label: 'Rank',
      value: `#${defaultStats.rank || 'Unranked'}`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-blue-500'
    },
    {
      label: 'Points',
      value: user.points.toLocaleString(),
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-500'
    },
    {
      label: 'Problems',
      value: defaultStats.problemsSolved.toString(),
      icon: <Code className="h-4 w-4" />,
      color: 'text-green-500'
    },
    {
      label: 'Challenges',
      value: defaultStats.challengesCompleted?.toString() || '0',
      icon: <Trophy className="h-4 w-4" />,
      color: 'text-orange-500'
    },
    {
      label: 'Streak',
      value: `${defaultStats.currentStreak || 0} days`,
      icon: <Award className="h-4 w-4" />,
      color: 'text-red-500'
    },
    {
      label: 'Followers',
      value: defaultStats.followers.toString(),
      icon: <Users className="h-4 w-4" />,
      color: 'text-cyan-500',
      clickable: true,
      onClick: onFollowersClick
    },
    {
      label: 'Following',
      value: defaultStats.following.toString(),
      icon: <Users className="h-4 w-4" />,
      color: 'text-cyan-500',
      clickable: true,
      onClick: onFollowingClick
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {statItems.map((item, index) => (
        <div 
          key={index} 
          className={`text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${
            item.clickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
          }`}
          onClick={item.clickable ? item.onClick : undefined}
        >
          <div className={`${item.color} flex justify-center mb-2`}>
            {item.icon}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            {item.label}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;
