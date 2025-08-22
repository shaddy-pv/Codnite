import React, { useState } from 'react';
import { Trophy, Clock, Users, Calendar, Search, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
const Challenges: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const upcomingChallenges = [{
    id: 1,
    title: 'MIT vs Stanford: Algorithm Speedrun',
    type: 'College Battle',
    description: 'Solve 5 algorithm problems in the shortest time',
    startTime: 'Tomorrow, 3:00 PM',
    duration: '2 hours',
    participants: 124,
    prize: '3000 points',
    tags: ['Algorithms', 'Speed', 'College']
  }, {
    id: 2,
    title: 'Weekly Coding Contest #42',
    type: 'Open Contest',
    description: 'Four problems of increasing difficulty',
    startTime: 'Saturday, 10:00 AM',
    duration: '3 hours',
    participants: 856,
    prize: '2500 points + Top Coder Badge',
    tags: ['Weekly', 'Open', 'Mixed']
  }, {
    id: 3,
    title: 'Google-sponsored System Design Challenge',
    type: 'Sponsored',
    description: 'Design a scalable e-commerce backend',
    startTime: 'Next Monday, 6:00 PM',
    duration: '4 hours',
    participants: 492,
    prize: '5000 points + Google Interview Opportunity',
    tags: ['System Design', 'Google', 'Career']
  }];
  const ongoingChallenges = [{
    id: 4,
    title: 'Facebook Frontend Hackathon',
    type: 'Sponsored',
    description: 'Build a social media component with React',
    timeRemaining: '3h 24m remaining',
    participants: 328,
    prize: '4000 points + Facebook Swag',
    tags: ['Frontend', 'React', 'Facebook']
  }];
  const pastChallenges = [{
    id: 5,
    title: 'Weekly Coding Contest #41',
    type: 'Open Contest',
    description: 'Four problems of increasing difficulty',
    date: '2 days ago',
    participants: 912,
    winner: 'Emily Chen (MIT)',
    tags: ['Weekly', 'Open', 'Mixed']
  }, {
    id: 6,
    title: 'Harvard vs Princeton: Data Structures Battle',
    type: 'College Battle',
    description: 'Implement and optimize 3 data structures',
    date: '5 days ago',
    participants: 186,
    winner: 'Harvard University',
    tags: ['Data Structures', 'College', 'Optimization']
  }];
  return <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-dark-300">
            Compete, learn, and climb the leaderboards
          </p>
        </div>
        <Button variant="primary" leftIcon={<Trophy className="h-5 w-5" />}>
          Create Challenge
        </Button>
      </div>
      {/* Search and Filter */}
      <div className="bg-dark-600 rounded-xl border border-dark-500 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-dark-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue" placeholder="Search challenges..." />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filters
            </Button>
            <select className="bg-dark-700 border border-dark-500 rounded-lg px-4 py-2.5 text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue">
              <option value="all">All Types</option>
              <option value="college">College Battles</option>
              <option value="open">Open Contests</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-dark-500 mb-6">
        <button onClick={() => setActiveTab('upcoming')} className={`py-3 px-6 border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          Upcoming
        </button>
        <button onClick={() => setActiveTab('ongoing')} className={`py-3 px-6 border-b-2 transition-colors ${activeTab === 'ongoing' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          Ongoing
        </button>
        <button onClick={() => setActiveTab('past')} className={`py-3 px-6 border-b-2 transition-colors ${activeTab === 'past' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-dark-300 hover:text-dark-100'}`}>
          Past
        </button>
      </div>
      {/* Challenge Cards */}
      <div className="space-y-6">
        {activeTab === 'upcoming' && upcomingChallenges.map(challenge => <div key={challenge.id} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Badge text={challenge.type} color="purple" size="md" />
                      <h3 className="text-lg font-medium ml-3">
                        {challenge.title}
                      </h3>
                    </div>
                    <p className="text-dark-300 mb-4">
                      {challenge.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {challenge.tags.map((tag, index) => <Badge key={index} text={tag} color="blue" />)}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-primary-blue mr-2" />
                        <span>{challenge.startTime}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-primary-blue mr-2" />
                        <span>{challenge.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-primary-blue mr-2" />
                        <span>{challenge.participants} participants</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-primary-blue mr-2" />
                        <span>{challenge.prize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="primary">Register</Button>
                  </div>
                </div>
              </div>
            </div>)}
        {activeTab === 'ongoing' && (ongoingChallenges.length > 0 ? ongoingChallenges.map(challenge => <div key={challenge.id} className="bg-dark-600 rounded-xl border border-primary-blue border-opacity-50 overflow-hidden">
                <div className="bg-primary-blue bg-opacity-10 px-6 py-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-primary-blue mr-2" />
                    <span className="text-primary-blue font-medium">
                      {challenge.timeRemaining}
                    </span>
                  </div>
                  <Badge text="LIVE" color="blue" />
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <Badge text={challenge.type} color="purple" size="md" />
                        <h3 className="text-lg font-medium ml-3">
                          {challenge.title}
                        </h3>
                      </div>
                      <p className="text-dark-300 mb-4">
                        {challenge.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {challenge.tags.map((tag, index) => <Badge key={index} text={tag} color="blue" />)}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-primary-blue mr-2" />
                          <span>{challenge.participants} participants</span>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-primary-blue mr-2" />
                          <span>{challenge.prize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="primary">Join Now</Button>
                    </div>
                  </div>
                </div>
              </div>) : <div className="bg-dark-600 rounded-xl border border-dark-500 p-8 text-center">
              <Trophy className="h-12 w-12 text-dark-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No ongoing challenges
              </h3>
              <p className="text-dark-300 mb-6">
                Check back later or register for upcoming challenges
              </p>
              <Button variant="outline" onClick={() => setActiveTab('upcoming')}>
                View upcoming challenges
              </Button>
            </div>)}
        {activeTab === 'past' && pastChallenges.map(challenge => <div key={challenge.id} className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Badge text={challenge.type} color="gray" size="md" />
                      <h3 className="text-lg font-medium ml-3">
                        {challenge.title}
                      </h3>
                    </div>
                    <p className="text-dark-300 mb-4">
                      {challenge.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {challenge.tags.map((tag, index) => <Badge key={index} text={tag} color="gray" />)}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-dark-300 mr-2" />
                        <span>{challenge.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-dark-300 mr-2" />
                        <span>{challenge.participants} participants</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-dark-300 mr-2" />
                        <span>Winner: {challenge.winner}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline">View Results</Button>
                  </div>
                </div>
              </div>
            </div>)}
      </div>
    </div>;
};
export default Challenges;