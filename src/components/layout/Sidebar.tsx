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
    <aside className="w-64 border-r border-ember-border bg-ember-bg-secondary min-h-screen flex flex-col relative z-20 transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-ember-border">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl h-8 w-8 flex items-center justify-center shadow-glow overflow-hidden">
            <img 
              src="/assets/codinte-logo-2.png" 
              alt="Codnite Logo" 
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-ember-text-primary">Codnite</h2>
            <p className="text-xs text-ember-text-secondary">Developer Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <nav className="px-3">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className={`
                      group flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary-600/20 to-secondary-600/20 text-primary-300 border border-primary-600/30 shadow-glow' 
                        : 'text-ember-text-secondary hover:bg-ember-bg-hover hover:text-ember-text-primary hover:border-ember-border-hover border border-transparent'
                      }
                    `}
                    title={item.description}
                  >
                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 animate-pulse"></div>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-600 to-secondary-600 rounded-r-full shadow-glow"></div>
                    )}
                    
                    <IconComponent 
                      className={`
                        h-4 w-4 transition-all duration-300 relative z-10
                        ${isActive 
                          ? 'text-primary-400 drop-shadow-sm' 
                          : 'text-ember-text-muted group-hover:text-ember-text-primary group-hover:scale-110'
                        }
                      `} 
                    />
                    
                    <div className="ml-3 flex-1 min-w-0 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm truncate transition-all duration-300 ${isActive ? 'text-primary-300' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="ml-2 bg-gradient-to-r from-primary-600/30 to-secondary-600/30 text-primary-300 text-xs font-medium px-2 py-0.5 rounded-full border border-primary-600/40 shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ember-text-muted truncate group-hover:text-ember-text-secondary transition-colors duration-300">
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
      <div className="p-3 border-t border-ember-border mt-auto">
        <div className="bg-gradient-to-r from-primary-600/15 to-secondary-600/15 rounded-xl p-4 border border-primary-600/25 shadow-glow backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-7 h-7 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center shadow-glow">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ember-text-primary">
                Level Up!
              </p>
              <p className="text-xs text-ember-text-secondary">
                Complete challenges to earn points
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            {levelLoading ? (
              <div className="animate-pulse">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <div className="h-2 w-8 bg-slate-600 rounded"></div>
                  <div className="h-2 w-16 bg-slate-600 rounded"></div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-slate-600 h-1.5 rounded-full w-1/2"></div>
                </div>
              </div>
            ) : levelData ? (
              <>
                <div className="flex justify-between text-xs text-ember-text-secondary mb-2">
                  <span className="font-medium">Level {levelData.level}</span>
                  <span className="font-medium">{levelData.points.toLocaleString()} / {levelData.nextLevelPoints.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-ember-bg-hover rounded-full h-2 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-700 ease-out shadow-glow relative overflow-hidden"
                    style={{ width: `${Math.min(levelData.progress, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-ember-text-muted">
                Unable to load level data
              </div>
            )}
          </div>
          
          {/* Achievement Badges */}
          <div className="flex space-x-2 mt-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              levelData?.badges.trophy === 'gold' ? 'bg-yellow-500/25 shadow-glow' :
              levelData?.badges.trophy === 'silver' ? 'bg-slate-500/25' :
              levelData?.badges.trophy === 'bronze' ? 'bg-primary-600/25' :
              'bg-ember-bg-hover'
            }`}>
              <Trophy className={`h-3 w-3 ${
                levelData?.badges.trophy === 'gold' ? 'text-yellow-400' :
                levelData?.badges.trophy === 'silver' ? 'text-slate-400' :
                levelData?.badges.trophy === 'bronze' ? 'text-primary-400' :
                'text-ember-text-muted'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              levelData?.badges.code === 'gold' ? 'bg-primary-600/25 shadow-glow' :
              levelData?.badges.code === 'silver' ? 'bg-slate-500/25' :
              levelData?.badges.code === 'bronze' ? 'bg-primary-600/25' :
              'bg-ember-bg-hover'
            }`}>
              <Code className={`h-3 w-3 ${
                levelData?.badges.code === 'gold' ? 'text-primary-400' :
                levelData?.badges.code === 'silver' ? 'text-slate-400' :
                levelData?.badges.code === 'bronze' ? 'text-primary-400' :
                'text-ember-text-muted'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              levelData?.badges.check === 'gold' ? 'bg-green-500/25 shadow-glow' :
              levelData?.badges.check === 'silver' ? 'bg-slate-500/25' :
              levelData?.badges.check === 'bronze' ? 'bg-primary-600/25' :
              'bg-ember-bg-hover'
            }`}>
              <CheckCircle className={`h-3 w-3 ${
                levelData?.badges.check === 'gold' ? 'text-green-400' :
                levelData?.badges.check === 'silver' ? 'text-slate-400' :
                levelData?.badges.check === 'bronze' ? 'text-primary-400' :
                'text-ember-text-muted'
              }`} />
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              levelData?.badges.star === 'gold' ? 'bg-secondary-600/25 shadow-glow' :
              levelData?.badges.star === 'silver' ? 'bg-slate-500/25' :
              levelData?.badges.star === 'bronze' ? 'bg-primary-600/25' :
              'bg-ember-bg-hover'
            }`}>
              <Star className={`h-3 w-3 ${
                levelData?.badges.star === 'gold' ? 'text-secondary-400' :
                levelData?.badges.star === 'silver' ? 'text-slate-400' :
                levelData?.badges.star === 'bronze' ? 'text-primary-400' :
                'text-ember-text-muted'
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