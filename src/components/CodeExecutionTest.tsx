import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { executionApi } from '../services/api';
import { Button } from './ui/Button';
import Loading from './ui/Loading';

interface TestResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
  exitCode: number;
}

const CodeExecutionTest: React.FC = () => {
  const [code, setCode] = useState('console.log("Hello World");');
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const executeCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await executionApi.testCode(code, language);
      setResult(response);
    } catch (error: any) {
      console.error('Execution error:', error);
      setResult({
        success: false,
        output: '',
        error: error.response?.data?.error || 'Failed to execute code',
        executionTime: 0,
        exitCode: -1
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    return result.success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = () => {
    if (!result) return 'text-gray-500';
    return result.success ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = () => {
    if (!result) return 'Ready';
    return result.success ? 'Success' : 'Failed';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Code Execution Test
            </h1>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={executeCode}
              disabled={isExecuting || !code.trim()}
              leftIcon={<Play className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExecuting ? 'Executing...' : 'Run Code'}
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="p-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none resize-none"
            style={{ minHeight: '300px' }}
            spellCheck={false}
          />
        </div>

        {/* Execution Status */}
        {isExecuting && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Loading size="sm" />
              <span className="text-gray-600 dark:text-gray-400">
                Executing your code...
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`font-semibold ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Runtime: {result.executionTime}ms</span>
                </div>
                <div className="flex items-center">
                  <span>Exit Code: {result.exitCode}</span>
                </div>
              </div>
            </div>

            {result.output && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Output:
                </div>
                <pre className="text-sm bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  {result.output}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Error:
                </div>
                <pre className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800 overflow-x-auto text-red-800 dark:text-red-200">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Sample Code Examples */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Sample Code Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">JavaScript</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`console.log("Hello World");
console.log(2 + 3);`}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLanguage('javascript');
                  setCode('console.log("Hello World");\nconsole.log(2 + 3);');
                }}
              >
                Use This Code
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Python</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`print("Hello World")
print(2 + 3)`}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLanguage('python');
                  setCode('print("Hello World")\nprint(2 + 3)');
                }}
              >
                Use This Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExecutionTest;
