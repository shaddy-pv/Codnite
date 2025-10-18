import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import CodeExecutionService, { ExecutionRequest } from '../services/CodeExecutionService';
import { query } from '../utils/database';
import logger from '../utils/logger';

const router = Router();
const executionService = new CodeExecutionService();

// Submit code for execution
router.post('/execute', authenticateToken, async (req: any, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.userId;

    if (!problemId || !code || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: problemId, code, language' 
      });
    }

    // Get problem details and test cases
    const problemResult = await query(
      `SELECT id, title, description, difficulty, test_cases, time_limit, memory_limit
       FROM problems WHERE id = $1`,
      [problemId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];
    const testCases = problem.test_cases || [];

    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases available for this problem' });
    }

    // Prepare execution request
    const executionRequest: ExecutionRequest = {
      code,
      language,
      testCases: testCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        description: tc.description
      })),
      timeLimit: problem.time_limit || 5,
      memoryLimit: problem.memory_limit || 64
    };

    // Execute code
    const results = await executionService.executeCode(executionRequest);

    // Calculate score
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Store submission
    const submissionResult = await query(
      `INSERT INTO submissions (user_id, problem_id, code, language, status, score, execution_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        userId,
        problemId,
        code,
        language,
        score === 100 ? 'accepted' : 'rejected',
        score,
        results.reduce((sum, r) => sum + r.executionTime, 0)
      ]
    );

    const submissionId = submissionResult.rows[0].id;

    // Store test case results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const testCase = testCases[i];
      
      await query(
        `INSERT INTO submission_test_results (submission_id, test_case_id, passed, output, error, execution_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          submissionId,
          testCase.id || i,
          result.success,
          result.output,
          result.error,
          result.executionTime
        ]
      );
    }

    res.json({
      submissionId,
      score,
      passedTests,
      totalTests,
      results: results.map((result, index) => ({
        testCase: index + 1,
        passed: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime
      })),
      status: score === 100 ? 'accepted' : 'rejected'
    });

  } catch (error) {
    logger.error('Code execution error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Get submission results
router.get('/submission/:submissionId', authenticateToken, async (req: any, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId;

    const submissionResult = await query(
      `SELECT s.*, p.title as problem_title
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [submissionId, userId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionResult.rows[0];

    // Get test case results
    const testResults = await query(
      `SELECT * FROM submission_test_results WHERE submission_id = $1`,
      [submissionId]
    );

    res.json({
      submission: {
        id: submission.id,
        problemTitle: submission.problem_title,
        language: submission.language,
        status: submission.status,
        score: submission.score,
        executionTime: submission.execution_time,
        createdAt: submission.created_at
      },
      testResults: testResults.rows.map(tr => ({
        testCase: tr.test_case_id,
        passed: tr.passed,
        output: tr.output,
        error: tr.error,
        executionTime: tr.execution_time
      }))
    });

  } catch (error) {
    logger.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Get user's submissions for a problem
router.get('/problem/:problemId/submissions', authenticateToken, async (req: any, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const submissionsResult = await query(
      `SELECT id, language, status, score, execution_time, created_at
       FROM submissions
       WHERE user_id = $1 AND problem_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, problemId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM submissions WHERE user_id = $1 AND problem_id = $2`,
      [userId, problemId]
    );

    res.json({
      submissions: submissionsResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Simple test execution endpoint (no auth required for testing)
router.post('/test', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, language' 
      });
    }

    // Simple test case for Hello World
    const testCases = [
      { 
        input: '', 
        expectedOutput: 'Hello World',
        description: 'Basic Hello World test'
      }
    ];

    const executionRequest: ExecutionRequest = {
      code,
      language,
      testCases,
      timeLimit: 5,
      memoryLimit: 64
    };

    const results = await executionService.executeCode(executionRequest);

    // For test endpoint, consider it successful if there's output and no error
    const testResult = results[0];
    const isSuccessful = testResult && testResult.output && !testResult.error;

    res.json({
      success: isSuccessful,
      output: testResult?.output || '',
      error: testResult?.error || '',
      executionTime: testResult?.executionTime || 0,
      exitCode: testResult?.exitCode || -1
    });

  } catch (error) {
    logger.error('Test execution error:', error);
    res.status(500).json({ error: 'Failed to execute test code' });
  }
});

// Health check for execution service
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await executionService.healthCheck();
    
    if (isHealthy) {
      res.json({ status: 'healthy', service: 'code-execution' });
    } else {
      res.status(503).json({ status: 'unhealthy', service: 'code-execution' });
    }
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({ status: 'unhealthy', service: 'code-execution', error: error.message });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    languages: [
      {
        id: 'javascript',
        name: 'JavaScript',
        version: '18',
        extension: '.js',
        template: `// Write your solution here
function solution(input) {
    // Your code here
    return input;
}

// Read input and call solution
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const result = solution(line.trim());
    console.log(result);
    rl.close();
});`
      },
      {
        id: 'python',
        name: 'Python',
        version: '3.11',
        extension: '.py',
        template: `# Write your solution here
def solution(input_str):
    # Your code here
    return input_str

# Read input and call solution
if __name__ == "__main__":
    import sys
    input_str = sys.stdin.read().strip()
    result = solution(input_str)
    print(result)`
      },
      {
        id: 'java',
        name: 'Java',
        version: '17',
        extension: '.java',
        template: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        String result = solution(input);
        System.out.println(result);
        scanner.close();
    }
    
    public static String solution(String input) {
        // Your code here
        return input;
    }
}`
      },
      {
        id: 'cpp',
        name: 'C++',
        version: '11',
        extension: '.cpp',
        template: `#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Your code here
    return input;
}

int main() {
    string input;
    getline(cin, input);
    string result = solution(input);
    cout << result << endl;
    return 0;
}`
      }
    ]
  });
});

export default router;
