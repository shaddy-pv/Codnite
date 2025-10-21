import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Code, Trophy, BarChart2, User, Settings, Sparkles, Terminal, CheckCircle, Star, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useLevelData } from '../../hooks/useLevelData';
import LevelUpNotification from '../LevelUpNotification';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [userCollegeId, setUserCollegeId] = useState<string | null>(null);
  const { levelData, loading: levelLoading, showLevelUp, hideLevelUp } = useLevelData();
  
  // Load user's college on component mount
  useEffect(() => {
    const loadUserCollege = async () => {
      try {
        const userData = await api.getMe();
        setUserCollegeId(userData.collegeId);
      } catch (error) {
        console.error('Failed to load user college:', error);
        // Fallback to MIT if user data can't be loaded
        setUserCollegeId('mit');
      }
    };
    
    loadUserCollege();
  }, []);
  
  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      description: 'Dashboard and feed'
    },
    {
      icon: Users,
      label: 'Community',
      path: userCollegeId ? `/community/${userCollegeId}` : '/community/mit',
      description: 'Connect with peers'
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: '/messages',
      description: 'Chat with users',
      badge: 'New'
    },
     {
       icon: Code,
       label: 'Problems',
       path: '/problems',
       description: 'Practice coding'
     },
     {
       icon: Terminal,
       label: 'Code Execution',
       path: '/code-execution',
       description: 'Test your code',
       badge: 'New'
     },
     {
       icon: Trophy,
       label: 'Challenges',
       path: '/challenges',
       description: 'Compete and win',
       badge: 'New'
     },
    {
      icon: BarChart2,
      label: 'Leaderboard',
      path: '/leaderboard',
      description: 'See rankings'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile/me',
      description: 'Your profile'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      description: 'Preferences'
    }
  ];

  return (
    <aside className="w-64 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative z-20">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl h-8 w-8 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Codnite</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Developer Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6">
        <nav className="px-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className={`
                      group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative
                      ${isActive 
                        ? '!bg-primary-100 dark:!bg-primary-900/20 !text-primary-700 dark:!text-primary-300 shadow-sm border-r-4 border-primary-600' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }
                    `}
                    title={item.description}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>
                    )}
                    
                    <IconComponent 
                      className={`
                        h-5 w-5 transition-colors duration-200
                        ${isActive 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                        }
                      `} 
                    />
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Level Up!
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Complete challenges to earn points
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-3">
            {levelLoading ? (
              <div className="animate-pulse">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  <div className="h-3 w-12 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                  <div className="h-3 w-20 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-neutral-300 dark:bg-neutral-600 h-2 rounded-full w-1/2"></div>
                </div>
              </div>
            ) : levelData ? (
              <>
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Level {levelData.level}</span>
                  <span>{levelData.points.toLocaleString()} / {levelData.nextLevelPoints.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(levelData.progress, 100)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Unable to load level data
              </div>
            )}
          </div>
          
          {/* Achievement Badges */}
          <div className="flex space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              levelData?.badges.trophy === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              levelData?.badges.trophy === 'silver' ? 'bg-gray-100 dark:bg-gray-900/30' :
              levelData?.badges.trophy === 'bronze' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <Trophy className={`h-3 w-3 ${
                levelData?.badges.trophy === 'gold' ? 'text-yellow-600 dark:text-yellow-400' :
                levelData?.badges.trophy === 'silver' ? 'text-gray-600 dark:text-gray-400' :
                levelData?.badges.trophy === 'bronze' ? 'text-orange-600 dark:text-orange-400' :
                'text-neutral-400'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              levelData?.badges.code === 'gold' ? 'bg-primary-100 dark:bg-primary-900/30' :
              levelData?.badges.code === 'silver' ? 'bg-gray-100 dark:bg-gray-900/30' :
              levelData?.badges.code === 'bronze' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <Code className={`h-3 w-3 ${
                levelData?.badges.code === 'gold' ? 'text-primary-600 dark:text-primary-400' :
                levelData?.badges.code === 'silver' ? 'text-gray-600 dark:text-gray-400' :
                levelData?.badges.code === 'bronze' ? 'text-orange-600 dark:text-orange-400' :
                'text-neutral-400'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              levelData?.badges.check === 'gold' ? 'bg-green-100 dark:bg-green-900/30' :
              levelData?.badges.check === 'silver' ? 'bg-gray-100 dark:bg-gray-900/30' :
              levelData?.badges.check === 'bronze' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <CheckCircle className={`h-3 w-3 ${
                levelData?.badges.check === 'gold' ? 'text-green-600 dark:text-green-400' :
                levelData?.badges.check === 'silver' ? 'text-gray-600 dark:text-gray-400' :
                levelData?.badges.check === 'bronze' ? 'text-orange-600 dark:text-orange-400' :
                'text-neutral-400'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              levelData?.badges.star === 'gold' ? 'bg-secondary-100 dark:bg-secondary-900/30' :
              levelData?.badges.star === 'silver' ? 'bg-gray-100 dark:bg-gray-900/30' :
              levelData?.badges.star === 'bronze' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <Star className={`h-3 w-3 ${
                levelData?.badges.star === 'gold' ? 'text-secondary-600 dark:text-secondary-400' :
                levelData?.badges.star === 'silver' ? 'text-gray-600 dark:text-gray-400' :
                levelData?.badges.star === 'bronze' ? 'text-orange-600 dark:text-orange-400' :
                'text-neutral-400'
              }`} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Level Up Notification */}
      {levelData && (
        <LevelUpNotification
          isVisible={showLevelUp}
          newLevel={levelData.level}
          points={levelData.points}
          onClose={hideLevelUp}
        />
      )}
    </aside>
  );
};

export default Sidebar;