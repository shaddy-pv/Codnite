import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import CodeEditor from '../components/CodeEditor';
import { api } from '../services/api';
import { Play, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examples: TestCase[];
  constraints: string[];
  tags: string[];
}

const CodeExecutionTest: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const { success, error: showError } = useToast();

  // Mock problems data
  useEffect(() => {
    const mockProblems: Problem[] = [
      {
        id: '1',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'easy',
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            expectedOutput: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          },
          {
            input: 'nums = [3,2,4], target = 6',
            expectedOutput: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
          }
        ],
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.'
        ],
        tags: ['Array', 'Hash Table']
      },
      {
        id: '2',
        title: 'Add Two Numbers',
        description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
        difficulty: 'medium',
        examples: [
          {
            input: 'l1 = [2,4,3], l2 = [5,6,4]',
            expectedOutput: '[7,0,8]',
            explanation: '342 + 465 = 807'
          }
        ],
        constraints: [
          'The number of nodes in each linked list is in the range [1, 100].',
          '0 <= Node.val <= 9',
          'It is guaranteed that the list represents a number that does not have leading zeros.'
        ],
        tags: ['Linked List', 'Math', 'Recursion']
      },
      {
        id: '3',
        title: 'Longest Substring Without Repeating Characters',
        description: 'Given a string s, find the length of the longest substring without repeating characters.',
        difficulty: 'medium',
        examples: [
          {
            input: 's = "abcabcbb"',
            expectedOutput: '3',
            explanation: 'The answer is "abc", with the length of 3.'
          },
          {
            input: 's = "bbbbb"',
            expectedOutput: '1',
            explanation: 'The answer is "b", with the length of 1.'
          }
        ],
        constraints: [
          '0 <= s.length <= 5 * 10^4',
          's consists of English letters, digits, symbols and spaces.'
        ],
        tags: ['Hash Table', 'String', 'Sliding Window']
      }
    ];

    setProblems(mockProblems);
    if (mockProblems.length > 0) {
      setSelectedProblem(mockProblems[0]);
    }
  }, []);

  const handleCodeExecution = async (code: string, language: string) => {
    if (!selectedProblem) return;

    setIsLoading(true);
    try {
      const result = await api.executeCode({
        code,
        language,
        testCases: selectedProblem.examples.map(ex => ({
          input: ex.input,
          expectedOutput: ex.expectedOutput
        }))
      });

      setExecutionResults(prev => [...prev, {
        id: Date.now().toString(),
        code,
        language,
        result,
        timestamp: new Date(),
        problemId: selectedProblem.id
      }]);

      if (result.success) {
        success('Code executed successfully!');
      } else {
        showError('Code execution failed');
      }
    } catch (err: any) {
      showError('Failed to execute code', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmission = async (code: string, language: string) => {
    if (!selectedProblem) return;

    setIsLoading(true);
    try {
      const result = await api.submitProblemSolution(selectedProblem.id, {
        code,
        language,
        status: 'submitted'
      });

      setExecutionResults(prev => [...prev, {
        id: Date.now().toString(),
        code,
        language,
        result,
        timestamp: new Date(),
        problemId: selectedProblem.id,
        isSubmission: true
      }]);

      success('Solution submitted successfully!');
    } catch (err: any) {
      showError('Failed to submit solution', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Code Execution System
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Test your coding skills with real-time code execution and submission
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Problems List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Problems
              </h2>
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => setSelectedProblem(problem)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedProblem?.id === problem.id
                        ? 'bg-primary-100 dark:bg-primary-900 border border-primary-300 dark:border-primary-700'
                        : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {problem.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      {problem.description.substring(0, 100)}...
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Problem Details and Code Editor */}
          <div className="lg:col-span-2">
            {selectedProblem ? (
              <div className="space-y-6">
                {/* Problem Description */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {selectedProblem.title}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedProblem.difficulty)}`}>
                      {selectedProblem.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                    {selectedProblem.description}
                  </p>

                  {/* Examples */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {selectedProblem.examples.map((example, index) => (
                        <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                Example {index + 1}:
                              </h4>
                              <div className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded font-mono text-sm">
                                <div className="text-neutral-600 dark:text-neutral-400 mb-1">Input:</div>
                                <div className="text-neutral-900 dark:text-neutral-100">{example.input}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                Output:
                              </h4>
                              <div className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded font-mono text-sm">
                                <div className="text-neutral-600 dark:text-neutral-400 mb-1">Expected:</div>
                                <div className="text-neutral-900 dark:text-neutral-100">{example.expectedOutput}</div>
                              </div>
                            </div>
                          </div>
                          {example.explanation && (
                            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                              <strong>Explanation:</strong> {example.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Constraints */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
                      {selectedProblem.constraints.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Code Editor */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                    Code Editor
                  </h3>
                  <CodeEditor
                    problemId={selectedProblem.id}
                    initialCode={`// Solution for ${selectedProblem.title}\nfunction solution() {\n    // Write your solution here\n    \n}`}
                    initialLanguage="javascript"
                    showHistory={true}
                    onCodeChange={(code, language) => {
                      console.log('Code changed:', { code, language });
                    }}
                    onSubmissionSuccess={(submission) => {
                      console.log('Submission successful:', submission);
                    }}
                  />
                </Card>

                {/* Execution Results */}
                {executionResults.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                      Execution Results
                    </h3>
                    <div className="space-y-4">
                      {executionResults
                        .filter(result => result.problemId === selectedProblem.id)
                        .slice(-5) // Show last 5 results
                        .map((result) => (
                          <div key={result.id} className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {result.isSubmission ? (
                                  <Play className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Play className="h-4 w-4 text-green-500" />
                                )}
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {result.isSubmission ? 'Submission' : 'Execution'} - {result.language}
                                </span>
                              </div>
                              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                {result.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {result.result && (
                              <div className="mt-3">
                                {result.result.success ? (
                                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Execution successful</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                    <XCircle className="h-4 w-4" />
                                    <span>Execution failed</span>
                                  </div>
                                )}
                                
                                {result.result.output && (
                                  <div className="mt-2">
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">Output:</h4>
                                    <pre className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded text-sm font-mono overflow-x-auto">
                                      {result.result.output}
                                    </pre>
                                  </div>
                                )}
                                
                                {result.result.error && (
                                  <div className="mt-2">
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">Error:</h4>
                                    <pre className="bg-red-100 dark:bg-red-900 p-3 rounded text-sm font-mono overflow-x-auto text-red-800 dark:text-red-200">
                                      {result.result.error}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Zap className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Select a Problem
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Choose a problem from the sidebar to start coding
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExecutionTest;
