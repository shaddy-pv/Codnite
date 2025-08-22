import React, { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Code, Trophy, User } from 'lucide-react';
const MobileNav: React.FC = () => {
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
    icon: User,
    label: 'Profile',
    path: '/profile/me'
  }];
  return <nav className="fixed bottom-0 left-0 right-0 bg-dark-700 border-t border-dark-600 px-2 py-2">
      <ul className="flex justify-around">
        {navItems.map((item, index) => {
        const IconComponent = item.icon;
        const isActive = location.pathname === item.path;
        return <li key={index} className="flex-1">
              <Link to={item.path} className="flex flex-col items-center py-1">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary-blue bg-opacity-20' : ''}`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-primary-blue' : 'text-dark-300'}`} />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-primary-blue' : 'text-dark-300'}`}>
                  {item.label}
                </span>
                {item.label === 'Challenges' && <span className="absolute top-0 right-0 bg-primary-purple h-2 w-2 rounded-full"></span>}
              </Link>
            </li>;
      })}
      </ul>
    </nav>;
};
export default MobileNav;