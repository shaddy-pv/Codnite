import React, { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Code, Trophy, BarChart2, User, Settings } from 'lucide-react';
const Sidebar: React.FC = () => {
  const location = useLocation();
  const navItems = [{
    icon: Home,
    label: 'Home',
    path: '/'
  }, {
    icon: Users,
    label: 'Community',
    path: '/community/mit'
  }, {
    icon: Code,
    label: 'Problems',
    path: '/problems'
  }, {
    icon: Trophy,
    label: 'Challenges',
    path: '/challenges'
  }, {
    icon: BarChart2,
    label: 'Leaderboard',
    path: '/leaderboard'
  }, {
    icon: User,
    label: 'Profile',
    path: '/profile/me'
  }, {
    icon: Settings,
    label: 'Settings',
    path: '/settings'
  }];
  return <aside className="w-64 border-r border-dark-600 bg-dark-700 h-full flex flex-col">
      <div className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {navItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return <li key={index}>
                <Link to={item.path} className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-dark-600 text-primary-blue' : 'text-dark-200 hover:bg-dark-600 hover:text-dark-100'}`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-primary-blue' : 'text-dark-300'}`} />
                  <span className="ml-3 font-medium">{item.label}</span>
                  {item.label === 'Challenges' && <span className="ml-auto bg-primary-purple text-xs font-medium px-2 py-0.5 rounded-full">
                      New
                    </span>}
                </Link>
              </li>;
        })}
        </ul>
      </div>
      <div className="p-4 border-t border-dark-600">
        <div className="bg-dark-600 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">College Challenge</h4>
          <p className="text-dark-300 text-xs mb-3">
            MIT vs Stanford - Ends in 2h 30m
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-primary-blue font-medium">120</span>
              <span className="text-dark-300 text-xs ml-1">points</span>
            </div>
            <button className="bg-primary-blue hover:bg-blue-600 text-white text-xs py-1 px-3 rounded-full transition-colors">
              Join Now
            </button>
          </div>
        </div>
      </div>
    </aside>;
};
export default Sidebar;