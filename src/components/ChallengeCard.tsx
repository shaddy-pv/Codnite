import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Users, Calendar, Play, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import Badge from './ui/Badge';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  _count?: {
    submissions: number;
  };
}

interface ChallengeCardProps {
  challenge: Challenge;
  status: 'upcoming' | 'ongoing' | 'past';
  onRegister?: () => void;
  onJoin?: () => void;
  onViewResults?: () => void;
  onViewDetails?: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  status,
  onRegister,
  onJoin,
  onViewResults,
  onViewDetails
}) => {
  const navigate = useNavigate();
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'hard':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'blue';
      case 'ongoing':
        return 'green';
      case 'past':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const isLive = status === 'ongoing';
  const participantCount = challenge._count?.submissions || 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden ${
      isLive ? 'border-blue-500 border-opacity-50' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {isLive && (
        <div className="bg-blue-50 dark:bg-blue-900 px-6 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-blue-500 font-medium">
              {getTimeRemaining(challenge.endDate)}
            </span>
          </div>
          <Badge text="LIVE" color="blue" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Badge 
                text={challenge.difficulty} 
                color={getDifficultyColor(challenge.difficulty)} 
                size="md" 
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                {challenge.title}
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {challenge.description}
            </p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                <span>
                  {status === 'past' ? 'Ended' : 'Starts'} {formatDate(challenge.startDate)}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <span>
                  {status === 'past' ? 'Ended' : 'Ends'} {formatDate(challenge.endDate)}
                </span>
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-2" />
                <span>{participantCount} participants</span>
              </div>
              
              <div className="flex items-center">
                <Trophy className="h-4 w-4 text-blue-500 mr-2" />
                <span>{challenge.points} points</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex flex-col gap-2">
            {status === 'upcoming' && (
              <>
                <Button variant="primary" onClick={onRegister}>
                  Register
                </Button>
                <Button variant="outline" onClick={() => navigate(`/challenge/${challenge.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </>
            )}
            
            {status === 'ongoing' && (
              <>
                <Button variant="primary" onClick={onJoin}>
                  <Play className="h-4 w-4 mr-2" />
                  Join Now
                </Button>
                <Button variant="outline" onClick={() => navigate(`/challenge/${challenge.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </>
            )}
            
            {status === 'past' && (
              <>
                <Button variant="outline" onClick={onViewResults}>
                  View Results
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/challenge/${challenge.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
