import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Moon, Sun, Menu, LogOut, User, ChevronDown, Settings, Award, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/Button';
import NotificationBell from '../NotificationBell';
import SearchModal from '../SearchModal';
import { api } from '../../services/api';

interface NavbarProps {
  user?: any;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);

  // Fetch user points when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      console.log('Navbar user data:', {
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        hasAvatarUrl: !!user.avatarUrl
      });
      fetchUserPoints();
    }
  }, [user?.id]);

  const fetchUserPoints = async () => {
    try {
      const userData = await api.getMe();
      setUserPoints(userData.points || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
      setUserPoints(0);
    }
  };

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchModalOpen(true);
    }
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen && !(event.target as Element).closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <header className="sticky top-0 z-20 bg-ember-bg-secondary/90 backdrop-blur-md border-b border-ember-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl h-9 w-9 flex items-center justify-center shadow-glow group-hover:shadow-strong group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-lg drop-shadow-sm">C</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:from-primary-500 group-hover:to-secondary-500 transition-all duration-300">
                Codnite
              </span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search posts, users, challenges..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={handleSearchClick}
                  className="w-full pl-10 pr-4 py-2.5 border border-ember-border rounded-xl bg-ember-bg-tertiary text-ember-text-primary placeholder:text-ember-text-muted focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 focus:shadow-glow transition-all duration-300 cursor-pointer hover:border-ember-border-hover"
                />
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              </form>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Points Display */}
            <div className="bg-gradient-to-r from-primary-600/15 to-secondary-600/15 rounded-xl px-4 py-2 border border-primary-600/30 shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-primary-400" />
                <span className="text-primary-300 font-semibold text-sm">
                  {formatPoints(userPoints)} points
                </span>
              </div>
            </div>
            
            {/* Notifications */}
            <NotificationBell className="text-ember-text-secondary hover:text-primary-400 hover:scale-110 transition-all duration-300" />
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl hover:bg-ember-bg-hover hover:scale-110 transition-all duration-300 group"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-ember-text-secondary group-hover:text-warning-400 group-hover:rotate-180 transition-all duration-300" />
              ) : (
                <Moon className="h-5 w-5 text-ember-text-secondary group-hover:text-primary-400 group-hover:rotate-12 transition-all duration-300" />
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-ember-bg-hover hover:scale-105 transition-all duration-300 group"
                >
                  <Avatar 
                    src={user.avatarUrl} 
                    alt={user.name}
                    size="sm" 
                    status="online"
                    className="group-hover:ring-2 group-hover:ring-primary-500 group-hover:shadow-glow transition-all duration-300"
                  />
                  <ChevronDown className={`w-4 h-4 text-ember-text-secondary group-hover:text-ember-text-primary transition-all duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown - Fixed positioning */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-ember-bg-secondary rounded-xl shadow-strong border border-ember-border py-2 z-30 animate-slide-down backdrop-blur-md">
                    <div className="px-4 py-3 border-b border-ember-border">
                      <p className="font-semibold text-ember-text-primary">{user.name}</p>
                      <p className="text-sm text-ember-text-secondary">@{user.username}</p>
                      <div className="flex items-center mt-2">
                        <Award className="w-4 h-4 text-primary-400 mr-1" />
                        <span className="text-sm text-primary-300 font-medium">
                          {formatPoints(userPoints)} points
                        </span>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to={`/profile/${user.id}`}
                        className="flex items-center px-4 py-2 text-sm text-ember-text-primary hover:bg-ember-bg-hover hover:text-primary-300 transition-all duration-300 rounded-lg mx-2"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        View Profile
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-ember-text-primary hover:bg-ember-bg-hover hover:text-primary-300 transition-all duration-300 rounded-lg mx-2"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            // This will need to be passed as a prop or use a global state
                            window.dispatchEvent(new CustomEvent('openAdminDashboard'));
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-primary-400 hover:bg-primary-600/10 hover:text-primary-300 transition-all duration-300 rounded-lg mx-2"
                        >
                          <Shield className="w-4 h-4 mr-3" />
                          Admin Dashboard
                        </button>
                      )}
                    </div>
                    
                    <div className="border-t border-ember-border pt-2 mt-2">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onLogout?.();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-error-400 hover:bg-error-500/10 hover:text-error-300 transition-all duration-300 rounded-lg mx-2"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                Welcome to Codnite
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationBell className="text-neutral-600 dark:text-neutral-400" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700 py-4 space-y-4 animate-slide-down">
            {/* Mobile Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleTheme} 
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  )}
                </button>
                
                {user && (
                  <Link to={`/profile/${user.id}`} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200">
                    <User className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  </Link>
                )}
              </div>

              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;