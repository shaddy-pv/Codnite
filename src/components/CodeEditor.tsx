import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { api } from '../services/api';
import { Play, Send, History, CheckCircle, XCircle, Loader2, Copy, Download } from 'lucide-react';

interface CodeEditorProps {
  problemId?: string;
  initialCode?: string;
  initialLanguage?: string;
  readOnly?: boolean;
  showHistory?: boolean;
  onCodeChange?: (code: string, language: string) => void;
  onSubmissionSuccess?: (submission: any) => void;
}

const supportedLanguages = [
  { label: 'JavaScript', value: 'javascript', extension: 'js' },
  { label: 'TypeScript', value: 'typescript', extension: 'ts' },
  { label: 'Python', value: 'python', extension: 'py' },
  { label: 'Java', value: 'java', extension: 'java' },
  { label: 'C++', value: 'cpp', extension: 'cpp' },
  { label: 'C#', value: 'csharp', extension: 'cs' },
  { label: 'Go', value: 'go', extension: 'go' },
  { label: 'Rust', value: 'rust', extension: 'rs' },
];

const CodeEditor: React.FC<CodeEditorProps> = ({
  problemId,
  initialCode = '// Write your code here',
  initialLanguage = 'javascript',
  readOnly = false,
  showHistory = false,
  onCodeChange,
  onSubmissionSuccess,
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState<string | null>(null);
  const [errorOutput, setErrorOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (showHistory && problemId) {
      fetchSubmissionHistory();
    }
  }, [showHistory, problemId]);

  const fetchSubmissionHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await api.getSubmissionHistory(problemId);
      setSubmissionHistory(history.submissions || []);
    } catch (err: any) {
      showError('Failed to fetch submission history', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [problemId, showError]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    onCodeChange?.(value, language);
  }, [language, onCodeChange]);

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value);
    onCodeChange?.(code, value);
  }, [code, onCodeChange]);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    setOutput(null);
    setErrorOutput(null);
    try {
      const result = await api.executeCode({ code, language });
      if (result.success) {
        setOutput(result.output);
        success('Code executed successfully!');
      } else {
        setErrorOutput(result.error || 'Execution failed');
        showError(result.error || 'Code execution failed');
      }
    } catch (err: any) {
      setErrorOutput(err.message || 'An unexpected error occurred during execution.');
      showError(err.message || 'Code execution failed');
    } finally {
      setIsLoading(false);
    }
  }, [code, language, success, showError]);

  const handleSubmit = useCallback(async () => {
    if (!problemId) {
      showError('Problem ID is required for submission.');
      return;
    }
    setIsLoading(true);
    setOutput(null);
    setErrorOutput(null);
    try {
      const result = await api.submitProblemSolution(problemId, {
        code,
        language,
        status: 'submitted'
      });
      if (result.success) {
        setOutput(`Submission Status: ${result.status}\nTest Cases Passed: ${result.testCasesPassed}/${result.totalTestCases}\nRuntime: ${result.runtime}ms\nMemory: ${result.memory}KB`);
        success('Solution submitted successfully!');
        onSubmissionSuccess?.(result);
        if (showHistory) fetchSubmissionHistory();
      } else {
        setErrorOutput(result.error || 'Submission failed');
        showError(result.error || 'Solution submission failed');
      }
    } catch (err: any) {
      setErrorOutput(err.message || 'An unexpected error occurred during submission.');
      showError(err.message || 'Solution submission failed');
    } finally {
      setIsLoading(false);
    }
  }, [problemId, code, language, success, showError, onSubmissionSuccess, showHistory, fetchSubmissionHistory]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      success('Code copied to clipboard!');
    } catch (err) {
      showError('Failed to copy code to clipboard');
    }
  }, [code, success, showError]);

  const downloadCode = useCallback(() => {
    const lang = supportedLanguages.find(l => l.value === language);
    const extension = lang?.extension || 'txt';
    const filename = `solution.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Code downloaded successfully!');
  }, [code, language, success]);

  const getLanguageTemplate = useCallback((lang: string) => {
    const templates: Record<string, string> = {
      javascript: 'function solution() {\n    // Write your solution here\n    \n}',
      typescript: 'function solution(): any {\n    // Write your solution here\n    \n}',
      python: 'def solution():\n    # Write your solution here\n    pass',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
      csharp: 'using System;\n\nclass Solution {\n    static void Main() {\n        // Write your solution here\n    }\n}',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}',
      rust: 'fn main() {\n    // Write your solution here\n}',
    };
    return templates[lang] || '// Write your code here';
  }, []);

  const handleLanguageTemplate = useCallback(() => {
    const template = getLanguageTemplate(language);
    setCode(template);
    onCodeChange?.(template, language);
  }, [language, getLanguageTemplate, onCodeChange]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-lg shadow-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)} 
            disabled={readOnly || isLoading}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          {!readOnly && (
            <>
              <Button onClick={handleLanguageTemplate} variant="outline" size="sm">
                Template
              </Button>
              <Button onClick={copyToClipboard} variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />}>
                Copy
              </Button>
              <Button onClick={downloadCode} variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                Download
              </Button>
              <Button onClick={handleExecute} disabled={isLoading} size="sm" leftIcon={<Play className="h-4 w-4" />}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run'}
              </Button>
              {problemId && (
                <Button onClick={handleSubmit} disabled={isLoading} size="sm" leftIcon={<Send className="h-4 w-4" />}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                </Button>
              )}
            </>
          )}
        </div>
        
        {showHistory && problemId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryPanel(prev => !prev)}
            leftIcon={<History className="h-4 w-4" />}
          >
            History
          </Button>
        )}
      </div>

      {/* Editor and Output */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className={`flex-1 ${showHistoryPanel ? 'lg:w-2/3' : 'lg:w-full'}`}>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={readOnly || isLoading}
            className="w-full h-96 p-4 font-mono text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
            placeholder="Write your code here..."
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              lineHeight: '1.5',
              tabSize: 2,
            }}
          />
        </div>

        {showHistoryPanel && problemId && (
          <div className="lg:w-1/3 border-l border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Submission History</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2 animate-pulse">
                    <div className="h-5 w-5 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : submissionHistory.length > 0 ? (
              <div className="space-y-4">
                {submissionHistory.map((submission) => (
                  <div key={submission.id} className="flex items-center space-x-2">
                    {submission.status === 'accepted' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {submission.language} - {submission.status}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Runtime: {submission.runtime}ms, Memory: {submission.memory}KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400">No submissions yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Output/Error Console */}
      {(output || errorOutput) && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Output:</h3>
          {output && (
            <pre className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-3 rounded-lg overflow-auto text-sm font-mono">
              {output}
            </pre>
          )}
          {errorOutput && (
            <pre className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg overflow-auto text-sm font-mono">
              {errorOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;