import React, { Component, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Code, Trophy, User } from 'lucide-react';
import { api } from '../../services/api';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const [userCollegeId, setUserCollegeId] = useState<string | null>(null);
  
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
  
  const navItems = [{
    icon: Home,
    label: 'Home',
    path: '/'
  }, {
    icon: Users,
    label: 'Community',
    path: userCollegeId ? `/community/${userCollegeId}` : '/community/mit'
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
  return <nav className="fixed bottom-0 left-0 right-0 bg-dark-700 border-t border-dark-600 px-2 py-2 z-20">
      <ul className="flex justify-around">
        {navItems.map((item, index) => {
        const IconComponent = item.icon;
        const isActive = location.pathname === item.path;
        return <li key={index} className="flex-1">
              <Link to={item.path} className="flex flex-col items-center py-1">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-neutral-600 bg-opacity-20' : ''}`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-neutral-300' : 'text-dark-300'}`} />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-neutral-300' : 'text-dark-300'}`}>
                  {item.label}
                </span>
                {item.label === 'Challenges' && <span className="absolute top-0 right-0 bg-neutral-500 h-2 w-2 rounded-full"></span>}
              </Link>
            </li>;
      })}
      </ul>
    </nav>;
};
export default MobileNav;