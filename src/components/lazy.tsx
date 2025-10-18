import { lazy } from 'react';

// Lazy load all pages for better performance
export const Home = lazy(() => import('../pages/Home'));
export const Login = lazy(() => import('../pages/Login'));
export const Onboarding = lazy(() => import('../pages/Onboarding'));
export const CollegeCommunity = lazy(() => import('../pages/CollegeCommunity'));
export const ProblemSolving = lazy(() => import('../pages/ProblemSolving'));
export const Challenges = lazy(() => import('../pages/Challenges'));
export const ChallengeDetails = lazy(() => import('../pages/ChallengeDetails'));
export const Problems = lazy(() => import('../pages/Problems'));
export const Leaderboard = lazy(() => import('../pages/Leaderboard'));
export const Profile = lazy(() => import('../pages/Profile'));
export const SearchResults = lazy(() => import('../pages/SearchResults'));
export const CodeExecutionTest = lazy(() => import('../pages/CodeExecutionTest'));

// Lazy load heavy components that are not statically imported elsewhere
export const Settings = lazy(() => import('../pages/Settings'));

// Note: Components that are both statically and dynamically imported 
// (like RichTextEditor, CodeEditor, PostCreateModal, etc.) should not be 
// included here to avoid chunk splitting issues