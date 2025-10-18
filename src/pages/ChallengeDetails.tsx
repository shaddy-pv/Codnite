import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Users, Calendar, Code, Play, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { api, Challenge, Submission } from '../services/api';
import { useToast } from '../components/ui/Toast';

const ChallengeDetails: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const { addToast } = useToast();

  // Load challenge details
  const loadChallenge = async () => {
    if (!challengeId) return;
    
    try {
      setIsLoading(true);
      const data = await api.getChallenge(challengeId);
      setChallenge(data);
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      addToast('Failed to load challenge details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load challenge on mount
  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  // Handle code submission
  const handleSubmit = async () => {
    if (!challengeId || !code.trim()) {
      addToast('Please write some code before submitting', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const submission = await api.submitSolution(challengeId, {
        code: code.trim(),
        language
      });
      
      setSubmissions(prev => [submission, ...prev]);
      addToast('Solution submitted successfully!', 'success');
    } catch (err: any) {
      addToast('Failed to submit solution', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get challenge status
  const getChallengeStatus = () => {
    if (!challenge) return 'loading';
    
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    
    if (startDate > now) return 'upcoming';
    if (endDate <= now) return 'ended';
    return 'active';
  };

  const status = getChallengeStatus();

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <Loading text="Loading challenge details..." />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <EmptyState
          title="Challenge not found"
          description="The challenge you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/challenges')}
          className="mr-4"
        >
          Back to Challenges
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {challenge.title}
          </h1>
          <div className="flex items-center mt-2">
            <Badge 
              text={challenge.difficulty} 
              color={getDifficultyColor(challenge.difficulty)} 
              size="md" 
            />
            {status === 'active' && (
              <Badge text="LIVE" color="blue" className="ml-2" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenge Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Challenge Description
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Code Editor */}
          {status === 'active' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Solution
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                  <Button
                    variant="primary"
                    leftIcon={<Play className="h-4 w-4" />}
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !code.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your solution here..."
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* Submissions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Submissions ({submissions.length})
            </h2>
            
            {submissions.length === 0 ? (
              <EmptyState
                title="No submissions yet"
                description="Be the first to submit a solution!"
              />
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4">
                        <Badge text={submission.language} color="blue" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(submission.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.status === 'accepted' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : submission.status === 'rejected' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {submission.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                      <pre className="text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                        <code>{submission.code}</code>
                      </pre>
                    </div>
                    
                    {submission.score > 0 && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Score: {submission.score} points
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Challenge Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Challenge Info
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Starts</div>
                  <div className="font-medium">{formatDate(challenge.startDate)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ends</div>
                  <div className="font-medium">{formatDate(challenge.endDate)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Points</div>
                  <div className="font-medium">{challenge.points}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
                  <div className="font-medium">{challenge._count?.submissions || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status
            </h3>
            
            {status === 'upcoming' && (
              <div className="text-center">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Challenge hasn't started yet
                </p>
              </div>
            )}
            
            {status === 'active' && (
              <div className="text-center">
                <Play className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Challenge is live!
                </p>
                <Button variant="primary" className="mt-3" onClick={() => {
                  const editor = document.querySelector('textarea');
                  editor?.focus();
                }}>
                  Start Coding
                </Button>
              </div>
            )}
            
            {status === 'ended' && (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Challenge has ended
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetails;
