import React, { useEffect, useState } from 'react';
// The App component's contents are currently a placeholder — please update this file first for a new design / component!

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import CollegeCommunity from './pages/CollegeCommunity';
import ProblemSolving from './pages/ProblemSolving';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import { ThemeProvider } from './context/ThemeContext';
export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <ThemeProvider>
      <Router>
        <div className="flex h-screen w-full bg-dark-700 text-dark-100">
          {isAuthenticated ? <>
              {!isMobile && <Sidebar />}
              <div className="flex flex-col flex-1 h-full overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-auto p-4">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/community/:collegeId" element={<CollegeCommunity />} />
                    <Route path="/problem/:problemId" element={<ProblemSolving />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                {isMobile && <MobileNav />}
              </div>
            </> : <Routes>
              <Route path="/*" element={<Onboarding onAuthenticate={() => setIsAuthenticated(true)} />} />
            </Routes>}
        </div>
      </Router>
    </ThemeProvider>;
}