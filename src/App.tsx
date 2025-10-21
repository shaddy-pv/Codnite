import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import Loading from './components/ui/Loading';
import { ToastContainer, useToast } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkStatus } from './components/ui/NetworkStatus';
import { RouteLazyWrapper } from './components/ui/LazyWrapper';
import PerformanceMonitor from './components/PerformanceMonitor';
import SearchModal from './components/SearchModal';
import ChatSystem from './components/ChatSystem';
import AdminDashboard from './components/AdminDashboard';
import { useAuthState } from './hooks/useAuthState';

// Lazy load pages
import {
  Home,
  Login,
  Onboarding,
  CollegeCommunity,
  ProblemSolving,
  Challenges,
  ChallengeDetails,
  Problems,
  Leaderboard,
  Profile,
  SearchResults,
  CodeExecutionTest,
  Messages,
  Settings,
} from './components/lazy';

export function App() {
  // Use HMR-resistant authentication hook
  const { user, isAuthenticated, isLoading, login, logout } = useAuthState();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLogin, setShowLogin] = useState(true); // Changed to true to show login by default
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showChatSystem, setShowChatSystem] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Admin dashboard keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl + Shift + A to open admin dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'A' && user?.role === 'admin') {
        setShowAdminDashboard(true);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user]);

  // URL parameter for admin access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' && user?.role === 'admin') {
      setShowAdminDashboard(true);
    }
  }, [user]);

  // Listen for admin dashboard open event from navbar
  useEffect(() => {
    const handleOpenAdminDashboard = () => {
      if (user?.role === 'admin') {
        setShowAdminDashboard(true);
      }
    };

    window.addEventListener('openAdminDashboard', handleOpenAdminDashboard);
    return () => window.removeEventListener('openAdminDashboard', handleOpenAdminDashboard);
  }, [user]);

  // Authentication is now handled by useAuthState hook
  // This hook persists state across HMR reloads

  const handleLogin = (userData: any, token: string) => {
    console.log('🚀 handleLogin called with:', { 
      userData: userData ? `${userData.name} (${userData.email})` : 'none', 
      token: token ? 'exists' : 'none' 
    });
    
    // Use the HMR-resistant login function
    login(userData, token);
    
    // Also update local state for immediate UI response
    setShowLogin(false);
    
    console.log('✅ Login completed - state persisted across HMR');
  };

  const handleLogout = () => {
    console.log('🚪 Logout called');
    logout(); // Use the HMR-resistant logout function
    setShowLogin(true);
  };

  const handleSwitchToLogin = () => {
    console.log('Switching to login, showLogin was:', showLogin);
    setShowLogin(true);
    console.log('Switched to login, showLogin is now:', true);
  };

  const handleSwitchToRegister = () => {
    console.log('Switching to register, showLogin was:', showLogin);
    setShowLogin(false);
    console.log('Switched to register, showLogin is now:', false);
  };

  if (isLoading) {
    console.log('⏳ App is loading...');
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl h-16 w-16 flex items-center justify-center shadow-lg mx-auto mb-4 animate-bounce-subtle">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <Loading size="lg" text="Loading Codnite..." />
          </div>
        </div>
      </ThemeProvider>
    );
  }

  console.log('🏠 App render decision:', {
    isAuthenticated,
    isLoading,
    user: user ? `${user.name} (${user.email})` : 'none',
    showLogin,
    hasToken: localStorage.getItem('token') ? 'yes' : 'no'
  });

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            {isAuthenticated ? (
              <>
                {console.log('🎯 Rendering MAIN APP - user is authenticated')}
                <div className="flex h-screen">
                  {!isMobile && <Sidebar />}
                  <div className="flex flex-col flex-1">
                    <Navbar user={user} onLogout={handleLogout} />
                    <main className="flex-1 bg-neutral-50 dark:bg-neutral-900">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <RouteLazyWrapper routeName="main content">
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/community/:collegeId" element={<CollegeCommunity />} />
                            <Route path="/problem/:problemId" element={<ProblemSolving />} />
                            <Route path="/challenges" element={<Challenges />} />
                            <Route path="/challenge/:challengeId" element={<ChallengeDetails />} />
                             <Route path="/problems" element={<Problems />} />
                             <Route path="/leaderboard" element={<Leaderboard />} />
                             <Route path="/profile/:userId" element={<Profile />} />
                             <Route path="/messages" element={<Messages />} />
                             <Route path="/search" element={<SearchResults />} />
                             <Route path="/code-execution" element={<CodeExecutionTest />} />
                             <Route path="/settings" element={<Settings />} />
                             <Route path="*" element={<Navigate to="/" />} />
                          </Routes>
                        </RouteLazyWrapper>
                      </div>
                    </main>
                    {isMobile && <MobileNav />}
                  </div>
                </div>
              </>
            ) : (
              <RouteLazyWrapper routeName="authentication">
                <Routes>
                  <Route 
                    path="/*" 
                    element={
                      (() => {
                        console.log('🎭 Rendering auth component:', { 
                          showLogin, 
                          isAuthenticated, 
                          isLoading,
                          hasToken: localStorage.getItem('token') ? 'yes' : 'no',
                          hasUser: localStorage.getItem('user') ? 'yes' : 'no'
                        });
                        
                        if (showLogin) {
                          console.log('📝 Rendering LOGIN component');
                          return (
                            <Login 
                              onLogin={handleLogin} 
                              onSwitchToRegister={handleSwitchToRegister} 
                            />
                          );
                        } else {
                          console.log('📋 Rendering REGISTRATION component');
                          return (
                            <Onboarding 
                              onAuthenticate={handleLogin}
                              onSwitchToLogin={handleSwitchToLogin}
                            />
                          );
                        }
                      })()
                    } 
                  />
                </Routes>
              </RouteLazyWrapper>
            )}
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
          <NetworkStatus />
          <PerformanceMonitor />
          
          {/* Global Modals */}
          <SearchModal 
            isOpen={showSearchModal} 
            onClose={() => setShowSearchModal(false)} 
          />
          <ChatSystem 
            isOpen={showChatSystem} 
            onClose={() => setShowChatSystem(false)} 
          />
          <AdminDashboard 
            isOpen={showAdminDashboard} 
            onClose={() => setShowAdminDashboard(false)} 
          />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}