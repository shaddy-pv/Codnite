import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Calendar, Search, Filter, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Loading, ChallengeSkeleton } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import ChallengeCard from '../components/ChallengeCard';
import ChallengeCreateModal from '../components/ChallengeCreateModal';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
const Challenges: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { addToast } = useToast();

  // Load challenges
  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const data = await api.getChallenges();
      setChallenges(data);
    } catch (err: any) {
      addToast('Failed to load challenges', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load challenges on mount
  useEffect(() => {
    loadChallenges();
  }, []);

  // Handle challenge creation
  const handleChallengeCreated = (newChallenge: any) => {
    setChallenges(prev => [newChallenge, ...prev]);
  };

  // Filter challenges based on status
  const getFilteredChallenges = () => {
    const now = new Date();
    
    return challenges.filter(challenge => {
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);
      
      // Filter by tab
      let matchesTab = false;
      if (activeTab === 'upcoming') {
        matchesTab = startDate > now;
      } else if (activeTab === 'ongoing') {
        matchesTab = startDate <= now && endDate > now;
      } else if (activeTab === 'past') {
        matchesTab = endDate <= now;
      }
      
      // Filter by search term
      const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by type (difficulty)
      let matchesType = true;
      if (filterType !== 'all') {
        matchesType = challenge.difficulty.toLowerCase() === filterType.toLowerCase();
      }
      
      return matchesTab && matchesSearch && matchesType;
    });
  };

  const filteredChallenges = getFilteredChallenges();

  // Handle challenge actions
  const handleRegister = async (challengeId: string) => {
    try {
      addToast('Registration successful! You can now participate in this challenge.', 'success');
    } catch (error) {
      addToast('Registration failed. Please try again.', 'error');
    }
  };

  const handleJoin = async (challengeId: string) => {
    try {
      addToast('Joined challenge successfully! Good luck!', 'success');
    } catch (error) {
      addToast('Failed to join challenge. Please try again.', 'error');
    }
  };

  const handleViewResults = (challengeId: string) => {
    addToast('Results feature coming soon!', 'info');
  };

  const handleViewDetails = (challengeId: string) => {
    addToast('Details feature coming soon!', 'info');
  };
  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenges</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Compete, learn, and climb the leaderboards
          </p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setIsCreating(true)}
        >
          Create Challenge
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
              placeholder="Search challenges..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filters
            </Button>
            <select 
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('upcoming')} 
          className={`py-3 px-6 border-b-2 transition-colors ${
            activeTab === 'upcoming' 
              ? 'border-neutral-500 text-neutral-300' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('ongoing')} 
          className={`py-3 px-6 border-b-2 transition-colors ${
            activeTab === 'ongoing' 
              ? 'border-neutral-500 text-neutral-300' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Ongoing
        </button>
        <button 
          onClick={() => setActiveTab('past')} 
          className={`py-3 px-6 border-b-2 transition-colors ${
            activeTab === 'past' 
              ? 'border-neutral-500 text-neutral-300' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Past
        </button>
      </div>

      {/* Challenge Cards */}
      <div className="space-y-6">
        {isLoading ? (
          <ChallengeSkeleton count={3} />
        ) : filteredChallenges.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} challenges`}
            description={
              activeTab === 'upcoming' 
                ? 'No upcoming challenges found. Check back later or create a new challenge!'
                : activeTab === 'ongoing'
                ? 'No ongoing challenges at the moment. Register for upcoming challenges!'
                : 'No past challenges found.'
            }
          />
        ) : (
          filteredChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              status={activeTab as 'upcoming' | 'ongoing' | 'past'}
              onRegister={() => handleRegister(challenge.id)}
              onJoin={() => handleJoin(challenge.id)}
              onViewResults={() => handleViewResults(challenge.id)}
              onViewDetails={() => handleViewDetails(challenge.id)}
            />
          ))
        )}
      </div>

      {/* Challenge Creation Modal */}
      <ChallengeCreateModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onChallengeCreated={handleChallengeCreated}
      />
    </div>
  );
};
export default Challenges;