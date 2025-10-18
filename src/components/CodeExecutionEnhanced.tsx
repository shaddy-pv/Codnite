import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, Download, Upload, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/FormCard';
import Badge from './ui/Badge';
import Loading from './ui/Loading';
import { enhancedExecutionApi } from '../services/api';
import { useToast } from './ui/Toast';
import { usePerformanceMonitor } from '../hooks/usePerformance';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface ExecutionResult {
  id: string;
  status: 'success' | 'error' | 'timeout' | 'runtime_error';
  output: string;
  error?: string;
  executionTime: number;
  memoryUsage: number;
  testCases?: {
    passed: number;
    total: number;
    results: Array<{
      testCaseId: string;
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      executionTime: number;
    }>;
  };
}

interface CodeExecutionProps {
  problemId?: string;
  initialCode?: string;
  language?: string;
  testCases?: TestCase[];
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
  className?: string;
  readOnly?: boolean;
}

const CodeExecution: React.FC<CodeExecutionProps> = ({
  problemId,
  initialCode = '',
  language = 'javascript',
  testCases = [],
  onCodeChange,
  onLanguageChange,
  className = '',
  readOnly = false
}) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExecutionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  const { success, error } = useToast();
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  
  // Performance monitoring
  usePerformanceMonitor('CodeExecution');

  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'c', label: 'C', extension: 'c' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  ];

  // Update code when initialCode changes
  useEffect(() => {
    if (initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
  }, [onLanguageChange]);

  // Execute code
  const executeCode = useCallback(async () => {
    if (!code.trim()) {
      error('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    try {
      const response = await enhancedExecutionApi.executeCode({
        code,
        language: selectedLanguage,
        testCases: testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        }))
      });

      const result: ExecutionResult = {
        id: response.id || Date.now().toString(),
        status: response.status,
        output: response.output || '',
        error: response.error,
        executionTime: response.executionTime || 0,
        memoryUsage: response.memoryUsage || 0,
        testCases: response.testCases
      };

      setExecutionResults(prev => [result, ...prev]);
      setCurrentResult(result);

      if (result.status === 'success') {
        success('Code executed successfully');
      } else {
        error('Code execution failed', result.error || 'Unknown error');
      }
    } catch (err: any) {
      error('Execution failed', err.message);
    } finally {
      setIsExecuting(false);
    }
  }, [code, selectedLanguage, testCases, success, error]);

  // Submit solution
  const submitSolution = useCallback(async () => {
    if (!problemId) {
      error('No problem selected for submission');
      return;
    }

    if (!code.trim()) {
      error('Please enter a solution to submit');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('submitting');
    
    try {
      const response = await enhancedExecutionApi.submitSolution({
        problemId,
        code,
        language: selectedLanguage
      });

      if (response.success) {
        setSubmissionStatus('success');
        success('Solution submitted successfully');
        
        // Update execution results with submission results
        const result: ExecutionResult = {
          id: response.id || Date.now().toString(),
          status: response.status,
          output: response.output || '',
          error: response.error,
          executionTime: response.executionTime || 0,
          memoryUsage: response.memoryUsage || 0,
          testCases: response.testCases
        };

        setExecutionResults(prev => [result, ...prev]);
        setCurrentResult(result);
      } else {
        setSubmissionStatus('error');
        error('Submission failed', response.error || 'Unknown error');
      }
    } catch (err: any) {
      setSubmissionStatus('error');
      error('Submission failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [problemId, code, selectedLanguage, success, error]);

  // Clear results
  const clearResults = useCallback(() => {
    setExecutionResults([]);
    setCurrentResult(null);
  }, []);

  // Reset code
  const resetCode = useCallback(() => {
    setCode(initialCode);
    onCodeChange?.(initialCode);
  }, [initialCode, onCodeChange]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'runtime_error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-neutral-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
      case 'runtime_error':
        return 'text-red-600 dark:text-red-400';
      case 'timeout':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Code Editor */}
      <Card>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Code Editor
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm"
                disabled={readOnly}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <Badge variant="outline" size="sm">
                {selectedLanguage}
              </Badge>
            </div>
          </div>

          {/* Code Textarea */}
          <div className="relative">
            <textarea
              ref={codeEditorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={`Enter your ${selectedLanguage} code here...`}
              className="w-full h-96 p-4 font-mono text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              readOnly={readOnly}
            />
            <div className="absolute top-2 right-2 text-xs text-neutral-500 dark:text-neutral-400">
              {code.length} characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={executeCode}
                disabled={isExecuting || !code.trim()}
                leftIcon={isExecuting ? <Loading size="sm" /> : <Play className="h-4 w-4" />}
              >
                {isExecuting ? 'Executing...' : 'Run Code'}
              </Button>
              
              {problemId && (
                <Button
                  variant="secondary"
                  onClick={submitSolution}
                  disabled={isSubmitting || !code.trim()}
                  leftIcon={isSubmitting ? <Loading size="sm" /> : <Upload className="h-4 w-4" />}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={resetCode}
                disabled={readOnly}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                leftIcon={<Square className="h-4 w-4" />}
              >
                Clear Results
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Cases */}
      {testCases.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Test Cases
          </h3>
          <div className="space-y-3">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Test Case {index + 1}
                  </span>
                  {testCase.isHidden && (
                    <Badge variant="outline" size="sm">
                      Hidden
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Input:</span>
                    <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-900 dark:text-neutral-100">
                      {testCase.input}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Expected Output:</span>
                    <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-900 dark:text-neutral-100">
                      {testCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Execution Results */}
      {executionResults.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Execution Results
              </h3>
              <Badge variant="outline" size="sm">
                {executionResults.length} result{executionResults.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-4">
              {executionResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentResult?.id === result.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                  onClick={() => setCurrentResult(result)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className={`font-medium ${getStatusColor(result.status)}`}>
                        {result.status === 'success' ? 'Success' : 
                         result.status === 'error' ? 'Error' :
                         result.status === 'timeout' ? 'Timeout' :
                         result.status === 'runtime_error' ? 'Runtime Error' : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>{result.executionTime}ms</span>
                      <span>{result.memoryUsage}KB</span>
                      <span>#{executionResults.length - index}</span>
                    </div>
                  </div>

                  {result.testCases && (
                    <div className="mb-2">
                      <Badge variant={result.testCases.passed === result.testCases.total ? 'success' : 'warning'} size="sm">
                        {result.testCases.passed}/{result.testCases.total} test cases passed
                      </Badge>
                    </div>
                  )}

                  {result.output && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Output:</span>
                      <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm text-neutral-900 dark:text-neutral-100 overflow-x-auto">
                        {result.output}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Error:</span>
                      <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-900 dark:text-red-100 overflow-x-auto">
                        {result.error}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Submission Status */}
      {submissionStatus !== 'idle' && (
        <Card>
          <div className="flex items-center space-x-3">
            {submissionStatus === 'submitting' && (
              <>
                <Loading size="sm" />
                <span className="text-neutral-600 dark:text-neutral-400">Submitting solution...</span>
              </>
            )}
            {submissionStatus === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Solution submitted successfully!</span>
              </>
            )}
            {submissionStatus === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Submission failed</span>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CodeExecution;
