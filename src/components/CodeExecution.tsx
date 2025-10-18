import React, { useState, useCallback, useRef } from 'react';
import { Play, Square, Download, Share2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { api } from '../services/api';

interface CodeExecutionProps {
  problemId?: string;
  initialCode?: string;
  language?: string;
  testCases?: any[];
  onSubmission?: (result: any) => void;
  className?: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
  testResults?: any[];
}

const CodeExecution: React.FC<CodeExecutionProps> = ({
  problemId,
  initialCode = '',
  language = 'javascript',
  testCases = [],
  onSubmission,
  className = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'c', label: 'C', extension: 'c' },
    { value: 'go', label: 'Go', extension: 'go' },
    { value: 'rust', label: 'Rust', extension: 'rs' },
    { value: 'php', label: 'PHP', extension: 'php' },
    { value: 'ruby', label: 'Ruby', extension: 'rb' },
  ];

  const executeCode = useCallback(async () => {
    if (!code.trim()) {
      error('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await api.executeCode({
        code,
        language: selectedLanguage,
        testCases: testCases.length > 0 ? testCases : undefined
      });

      setExecutionResult(response);
      
      if (response.success) {
        success('Code executed successfully');
      } else {
        error('Code execution failed');
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        output: '',
        error: err.message || 'Execution failed'
      });
      error('Failed to execute code', err.message);
    } finally {
      setIsExecuting(false);
    }
  }, [code, selectedLanguage, testCases, success, error]);

  const submitSolution = useCallback(async () => {
    if (!problemId) {
      error('No problem selected for submission');
      return;
    }

    if (!code.trim()) {
      error('Please enter a solution');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.submitSolution({
        problemId,
        code,
        language: selectedLanguage
      });

      setExecutionResult(response);
      onSubmission?.(response);
      
      if (response.success) {
        success('Solution submitted successfully');
      } else {
        error('Solution submission failed');
      }
    } catch (err: any) {
      error('Failed to submit solution', err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [problemId, code, selectedLanguage, onSubmission, success, error]);

  const downloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution.${languages.find(l => l.value === selectedLanguage)?.extension || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, selectedLanguage]);

  const shareCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      success('Code copied to clipboard');
    } catch (err) {
      error('Failed to copy code to clipboard');
    }
  }, [code, success, error]);

  const formatExecutionTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatMemoryUsage = (memory: number) => {
    if (memory < 1024) return `${memory}B`;
    if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(1)}KB`;
    return `${(memory / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Code Editor
          </h3>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCode}
            disabled={!code.trim()}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareCode}
            disabled={!code.trim()}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={executeCode}
            disabled={isExecuting || !code.trim()}
          >
            {isExecuting ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting ? 'Executing...' : 'Run'}
          </Button>
          {problemId && (
            <Button
              onClick={submitSolution}
              disabled={isSubmitting || !code.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Enter your ${languages.find(l => l.value === selectedLanguage)?.label} code here...`}
          className="w-full h-96 p-4 font-mono text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border-0 resize-none focus:outline-none"
          spellCheck={false}
        />
        
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 w-12 h-96 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs font-mono p-4 pt-4 leading-6 select-none pointer-events-none">
          {code.split('\n').map((_, index) => (
            <div key={index} className="h-6">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="border-t border-neutral-200 dark:border-neutral-700">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {executionResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium text-neutral-900 dark:text-white">
                {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
              </span>
              {executionResult.executionTime && (
                <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 ml-auto">
                  <Clock className="h-4 w-4" />
                  {formatExecutionTime(executionResult.executionTime)}
                </div>
              )}
              {executionResult.memoryUsage && (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatMemoryUsage(executionResult.memoryUsage)}
                </div>
              )}
            </div>

            {/* Output */}
            {executionResult.output && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Output:
                </h4>
                <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md text-sm font-mono text-neutral-900 dark:text-white overflow-x-auto">
                  {executionResult.output}
                </pre>
              </div>
            )}

            {/* Error */}
            {executionResult.error && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Error:
                </h4>
                <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm font-mono text-red-800 dark:text-red-200 overflow-x-auto">
                  {executionResult.error}
                </pre>
              </div>
            )}

            {/* Test Results */}
            {executionResult.testResults && executionResult.testResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Test Results:
                </h4>
                <div className="space-y-2">
                  {executionResult.testResults.map((test, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border ${
                        test.passed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {test.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">
                          Test Case {index + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          test.passed
                            ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                        }`}>
                          {test.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      {test.input && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                          <strong>Input:</strong> {test.input}
                        </div>
                      )}
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        <strong>Expected:</strong> {test.expected}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        <strong>Actual:</strong> {test.actual}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeExecution;