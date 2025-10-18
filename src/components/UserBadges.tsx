import React from 'react';
import { Award, Trophy, Star, TrendingUp, Code, Users } from 'lucide-react';
import Badge from './ui/Badge';

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: 'blue' | 'purple' | 'cyan' | 'green' | 'yellow' | 'red';
  earnedAt: string;
}

interface UserBadgesProps {
  badges: UserBadge[];
  className?: string;
}

const UserBadges: React.FC<UserBadgesProps> = ({ badges, className = '' }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="h-6 w-6" />;
      case 'trophy':
        return <Trophy className="h-6 w-6" />;
      case 'star':
        return <Star className="h-6 w-6" />;
      case 'trending-up':
        return <TrendingUp className="h-6 w-6" />;
      case 'code':
        return <Code className="h-6 w-6" />;
      case 'users':
        return <Users className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'purple':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300';
      case 'green':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
      case 'red':
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (badges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No badges yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start solving problems and participating in challenges to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className={`${getColorClasses(badge.color)} h-12 w-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
              {getIcon(badge.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {badge.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {badge.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge text={badge.color} color={badge.color} size="sm" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserBadges;
