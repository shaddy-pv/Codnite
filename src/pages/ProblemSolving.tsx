import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageSquare, ThumbsUp, Save, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import CodeEditor from '../components/CodeEditor';
import { api, Problem, ProblemSubmission, executionApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
const ProblemSolving: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('description');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { addToast } = useToast();

  // Load problem data
  const loadProblem = async () => {
    if (!problemId) return;
    
    try {
      setIsLoading(true);
      const [problemData, submissionsData] = await Promise.all([
        api.getProblem(problemId),
        api.getProblemSubmissions(problemId)
      ]);
      
      setProblem(problemData);
      setSubmissions(submissionsData);
      
      // Set default code based on language
      if (submissionsData.length > 0) {
        const lastSubmission = submissionsData[0];
        setCode(lastSubmission.code);
        setSelectedLanguage(lastSubmission.language);
      } else {
        setDefaultCode();
      }
    } catch (err: any) {
      addToast('Failed to load problem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set default code based on language
  const setDefaultCode = () => {
    const defaultCodes = {
      javascript: `function solution(input) {
  // Your code here
  return input;
}`,
      python: `def solution(input):
    # Your code here
    return input`,
      java: `public class Solution {
    public Object solution(Object input) {
        // Your code here
        return input;
    }
}`,
      cpp: `#include <iostream>
using namespace std;

int solution(int input) {
    // Your code here
    return input;
}`
    };
    
    setCode(defaultCodes[selectedLanguage as keyof typeof defaultCodes] || defaultCodes.javascript);
  };

  // Load problem on mount
  useEffect(() => {
    loadProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (!submissions.length) {
      setDefaultCode();
    }
  }, [selectedLanguage]);

  // Handle code submission
  const handleSubmit = async () => {
    if (!problemId || !code.trim()) {
      addToast('Please write some code before submitting', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First, execute the code to get results
      const executionResult = await executionApi.testCode(code, selectedLanguage);
      
      // Create submission data with execution results
      const submissionData = {
        code: code.trim(),
        language: selectedLanguage,
        status: executionResult.success ? 'accepted' : 'runtime_error',
        runtime: executionResult.executionTime,
        memory: 0, // Not available from current execution service
        testCasesPassed: executionResult.success ? 1 : 0,
        totalTestCases: 1,
        output: executionResult.output,
        error: executionResult.error
      };
      
      // Submit to backend (this will save to database)
      const submission = await api.submitProblemSolution(problemId, submissionData);
      
      // Update local state with the submission
      const fullSubmission = {
        ...submission,
        code: submissionData.code,
        language: submissionData.language,
        output: submissionData.output,
        error: submissionData.error
      };
      
      setResult(fullSubmission);
      setSubmissions(prev => [fullSubmission, ...prev]);
      
      if (submission.status === 'accepted') {
        addToast('Solution accepted! 🎉', 'success');
      } else {
        addToast(`Solution ${submission.status.replace('_', ' ')}`, 'warning');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      addToast('Failed to submit solution', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle code execution (run)
  const handleRun = async () => {
    if (!code.trim()) {
      addToast('Please write some code before running', 'warning');
      return;
    }

    try {
      setIsRunning(true);
      
      // Use the real code execution engine
      const executionResult = await executionApi.testCode(code, selectedLanguage);
      
      // Convert execution result to problem result format
      const problemResult = {
        status: executionResult.success ? 'accepted' : 'runtime_error',
        runtime: executionResult.executionTime,
        memory: 0, // Not available from current execution service
        testCasesPassed: executionResult.success ? 1 : 0,
        totalTestCases: 1,
        output: executionResult.output,
        error: executionResult.error
      };
      
      setResult(problemResult);
      
      if (executionResult.success) {
        addToast('Code executed successfully!', 'success');
      } else {
        addToast(`Execution failed: ${executionResult.error}`, 'error');
      }
    } catch (err: any) {
      console.error('Code execution error:', err);
      addToast('Failed to run code', 'error');
      setResult({
        status: 'runtime_error',
        runtime: 0,
        memory: 0,
        testCasesPassed: 0,
        totalTestCases: 1,
        output: '',
        error: err.response?.data?.error || 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Handle save code
  const handleSave = async () => {
    // In a real implementation, this would save to localStorage or backend
    localStorage.setItem(`problem_${problemId}_code`, code);
    localStorage.setItem(`problem_${problemId}_language`, selectedLanguage);
    addToast('Code saved locally', 'success');
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

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <Loading text="Loading problem..." />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <EmptyState
          title="Problem not found"
          description="The problem you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }
  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Problem header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-3">
              {problem.title}
            </h1>
            <Badge 
              text={problem.difficulty} 
              color={getDifficultyColor(problem.difficulty)} 
            />
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
            <span>Acceptance: {problem.acceptanceRate.toFixed(1)}%</span>
            <span className="mx-2">•</span>
            <span>Submissions: {problem._count?.submissions || 0}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            variant="outline" 
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate(1)}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Problem description */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setActiveTab('description')} 
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeTab === 'description' 
                    ? 'border-b-2 border-blue-500 text-blue-500' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('submissions')} 
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeTab === 'submissions' 
                    ? 'border-b-2 border-blue-500 text-blue-500' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Submissions ({submissions.length})
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <div>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                      {problem.description}
                    </p>
                  </div>
                  
                  {problem.examples && problem.examples.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Examples:</h3>
                      <div className="space-y-4">
                        {problem.examples.map((example, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                            <div className="mb-1">
                              <span className="text-gray-500 dark:text-gray-400">Input: </span>
                              <span className="font-mono text-gray-900 dark:text-white">{example.input}</span>
                            </div>
                            <div className="mb-1">
                              <span className="text-gray-500 dark:text-gray-400">Output: </span>
                              <span className="font-mono text-gray-900 dark:text-white">{example.output}</span>
                            </div>
                            {example.explanation && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Explanation: </span>
                                <span className="text-gray-700 dark:text-gray-300">{example.explanation}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {problem.constraints && problem.constraints.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Constraints:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index} className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {problem.tags && problem.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Tags:</h3>
                      <div className="flex flex-wrap gap-2">
                        {problem.tags.map((tag, index) => (
                          <Badge key={index} text={tag} color="blue" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {problem.companies && problem.companies.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Companies:</h3>
                      <div className="flex flex-wrap gap-2">
                        {problem.companies.map((company, index) => (
                          <Badge key={index} text={company} color="gray" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <EmptyState
                      title="No submissions yet"
                      description="Submit your solution to see it here!"
                    />
                  ) : (
                    submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-4">
                            <Badge text={submission.language} color="blue" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {submission.status === 'accepted' ? (
                              <span className="text-green-500 font-medium">Accepted</span>
                            ) : (
                              <span className="text-red-500 font-medium">
                                {submission.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-2">
                          <pre className="text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                            <code>{submission.code}</code>
                          </pre>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center space-x-4">
                            <span>Runtime: {submission.runtime}ms</span>
                            <span>Memory: {submission.memory}MB</span>
                          </div>
                          <span>
                            {submission.testCasesPassed}/{submission.totalTestCases} test cases passed
                          </span>
                        </div>
                        
                        {submission.output && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Output:</span>
                            <pre className="bg-gray-100 dark:bg-gray-600 rounded p-2 text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {submission.output}
                            </pre>
                          </div>
                        )}
                        
                        {submission.error && (
                          <div>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">Error:</span>
                            <pre className="bg-red-100 dark:bg-red-900 rounded p-2 text-sm text-red-800 dark:text-red-200 mt-1">
                              {submission.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right panel - Code editor */}
        <div className="lg:w-1/2">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onSave={handleSave}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            result={result}
          />
        </div>
      </div>
    </div>
  );
};
export default ProblemSolving;