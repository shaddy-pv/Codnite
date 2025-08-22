import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
const Navbar: React.FC = () => {
  const {
    isDarkMode,
    toggleTheme
  } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [{
    id: 1,
    type: 'challenge',
    message: 'New challenge: 30-min coding battle',
    time: '2m ago'
  }, {
    id: 2,
    type: 'rank',
    message: 'Your college rank improved to #3',
    time: '1h ago'
  }, {
    id: 3,
    type: 'mention',
    message: 'Alex mentioned you in a comment',
    time: '3h ago'
  }];
  return <header className="border-b border-dark-600 bg-dark-700 py-3 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-6">
            <div className="bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg h-8 w-8 flex items-center justify-center mr-2">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-purple">
              Codnite
            </span>
          </Link>
          <div className="hidden md:flex relative rounded-full bg-dark-600 px-3 py-1.5 w-64">
            <Search className="h-5 w-5 text-dark-300" />
            <input type="text" placeholder="Search problems, people..." className="bg-transparent border-none outline-none text-dark-100 ml-2 w-full" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-dark-600 rounded-full px-3 py-1 flex items-center">
            <span className="text-primary-blue font-medium mr-1">2.4k</span>
            <span className="text-dark-300 text-sm">points</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-dark-600 transition-colors">
              <Bell className="h-5 w-5 text-dark-200" />
              <span className="absolute top-1 right-1 bg-primary-purple h-2 w-2 rounded-full"></span>
            </button>
            {showNotifications && <div className="absolute right-0 mt-2 w-80 bg-dark-600 rounded-lg shadow-lg border border-dark-500 z-10 animate-fade-in">
                <div className="p-3 border-b border-dark-500">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notification => <div key={notification.id} className="p-3 hover:bg-dark-500 cursor-pointer border-b border-dark-500">
                      <div className="flex">
                        <div className="mr-3">
                          {notification.type === 'challenge' && <div className="bg-primary-blue bg-opacity-20 p-2 rounded-full">
                              <span className="text-primary-blue text-xs">
                                🏆
                              </span>
                            </div>}
                          {notification.type === 'rank' && <div className="bg-primary-purple bg-opacity-20 p-2 rounded-full">
                              <span className="text-primary-purple text-xs">
                                📈
                              </span>
                            </div>}
                          {notification.type === 'mention' && <div className="bg-primary-cyan bg-opacity-20 p-2 rounded-full">
                              <span className="text-primary-cyan text-xs">
                                💬
                              </span>
                            </div>}
                        </div>
                        <div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-dark-300 text-xs">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
                <div className="p-2 text-center border-t border-dark-500">
                  <Link to="/notifications" className="text-primary-blue text-sm">
                    View all
                  </Link>
                </div>
              </div>}
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-dark-600 transition-colors">
            {isDarkMode ? <Sun className="h-5 w-5 text-dark-200" /> : <Moon className="h-5 w-5 text-dark-200" />}
          </button>
          <Link to="/profile/me">
            <Avatar src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" size="sm" status="online" />
          </Link>
        </div>
      </div>
    </header>;
};
export default Navbar;