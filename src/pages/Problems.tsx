import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProblemList from '../components/ProblemList';
import { Problem } from '../services/api';

const Problems: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  const handleProblemSelect = (problem: Problem) => {
    navigate(`/problem/${problem.id}`);
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Coding Problems
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice coding problems and improve your skills
        </p>
      </div>

      {/* Problem List */}
      <ProblemList onProblemSelect={handleProblemSelect} />
    </div>
  );
};

export default Problems;
