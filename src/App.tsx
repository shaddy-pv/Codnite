import React, { useEffect, useState, Suspense } from 'react';
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
  Settings,
} from './components/lazy';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
            // Store user data in localStorage for consistency
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: any, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLogin(false);
    // Store user data in localStorage for consistency
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setShowLogin(false);
  };

  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
  };

  if (isLoading) {
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

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            {isAuthenticated ? (
              <>
                <div className="flex h-screen">
                  {!isMobile && <Sidebar />}
                  <div className="flex flex-col flex-1 h-screen overflow-hidden">
                    <Navbar user={user} onLogout={handleLogout} />
                     <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
                       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                      showLogin ? (
                        <Login 
                          onLogin={handleLogin} 
                          onSwitchToRegister={handleSwitchToRegister} 
                        />
                      ) : (
                        <Onboarding 
                          onAuthenticate={handleLogin}
                          onSwitchToLogin={handleSwitchToLogin}
                        />
                      )
                    } 
                  />
                </Routes>
              </RouteLazyWrapper>
            )}
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
          <NetworkStatus />
          <PerformanceMonitor />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}