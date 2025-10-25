import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
  exitCode: number;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface ExecutionRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
}

class CodeExecutionService {
  private readonly WORK_DIR = path.join(os.tmpdir(), 'codnite-exec');
  private readonly MAX_EXECUTION_TIME = 30; // seconds
  private readonly MAX_MEMORY_LIMIT = 128; // MB

  constructor() {
    // Ensure work directory exists
    this.ensureWorkDir();
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult[]> {
    const executionId = uuidv4();
    const results: ExecutionResult[] = [];

    try {
      // Validate request
      this.validateRequest(request);

      // Create execution directory
      const execDir = path.join(this.WORK_DIR, executionId);
      await fs.mkdir(execDir, { recursive: true });

      try {
        // Write code to file
        const filePath = await this.writeCodeToFile(execDir, request.code, request.language);

        // Execute test cases
        for (const testCase of request.testCases) {
          const result = await this.executeTestCase(
            filePath,
            testCase,
            request.language,
            request.timeLimit,
            request.memoryLimit
          );
          results.push(result);
        }

        return results;
      } finally {
        // Clean up execution directory
        await this.cleanupExecutionDir(execDir);
      }
    } catch (error) {
      logger.error('Code execution error:', error);
      return [{
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        exitCode: -1
      }];
    }
  }

  private validateRequest(request: ExecutionRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new Error('Code cannot be empty');
    }

    if (!request.language || !this.isSupportedLanguage(request.language)) {
      throw new Error(`Unsupported language: ${request.language}`);
    }

    if (!request.testCases || request.testCases.length === 0) {
      throw new Error('At least one test case is required');
    }

    if (request.timeLimit > this.MAX_EXECUTION_TIME) {
      throw new Error(`Time limit cannot exceed ${this.MAX_EXECUTION_TIME} seconds`);
    }

    if (request.memoryLimit > this.MAX_MEMORY_LIMIT) {
      throw new Error(`Memory limit cannot exceed ${this.MAX_MEMORY_LIMIT} MB`);
    }
  }

  private isSupportedLanguage(language: string): boolean {
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
    return supportedLanguages.includes(language.toLowerCase());
  }

  private async ensureWorkDir(): Promise<void> {
    try {
      await fs.mkdir(this.WORK_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create work directory:', error);
    }
  }

  private async writeCodeToFile(execDir: string, code: string, language: string): Promise<string> {
    const fileName = this.getFileName(language);
    const filePath = path.join(execDir, fileName);
    
    await fs.writeFile(filePath, code, 'utf8');
    return filePath;
  }

  private getFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'solution.js',
      python: 'solution.py',
      java: 'Solution.java',
      cpp: 'solution.cpp'
    };
    return extensions[language.toLowerCase()] || 'solution.js';
  }

  private async executeTestCase(
    filePath: string,
    testCase: TestCase,
    language: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const command = this.getExecutionCommand(filePath, language);
      
      // Execute with timeout
      const result = await Promise.race([
        this.runExecution(command, testCase.input),
        this.createTimeout(timeLimit * 1000)
      ]);

      const executionTime = Date.now() - startTime;

      if ('timedOut' in result) {
        return {
          success: false,
          output: '',
          error: 'Execution timeout',
          executionTime,
          exitCode: -1
        };
      }

      const { stdout, stderr, exitCode } = result;

      // Validate output
      const isCorrect = this.validateOutput(stdout, testCase.expectedOutput);

      return {
        success: isCorrect && exitCode === 0,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
        executionTime,
        exitCode
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime,
        exitCode: -1
      };
    }
  }

  private getExecutionCommand(filePath: string, language: string): string[] {
    const commands: Record<string, string[]> = {
      javascript: ['node', filePath],
      python: ['python', filePath],
      java: ['java', '-cp', path.dirname(filePath), 'Solution'],
      cpp: [filePath.replace('.cpp', '')] // Assumes compiled binary
    };
    return commands[language.toLowerCase()] || ['node', filePath];
  }

  private async runExecution(command: string[], input: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      if (!command[0]) {
        reject(new Error('Invalid command'));
        return;
      }
      const child = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000 // 30 second timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code === null ? 0 : code
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Send input
      child.stdin.write(input);
      child.stdin.end();
    });
  }

  private createTimeout(ms: number): Promise<{ timedOut: true }> {
    return new Promise(resolve => {
      setTimeout(() => resolve({ timedOut: true }), ms);
    });
  }

  private validateOutput(actual: string, expected: string): boolean {
    // Normalize whitespace and line endings
    const normalize = (str: string) => str.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalize(actual) === normalize(expected);
  }

  private async cleanupExecutionDir(execDir: string): Promise<void> {
    try {
      await fs.rm(execDir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup execution directory:', error);
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic execution with a simple JavaScript program
      const testCode = 'console.log("Hello World");';
      const testCases = [{ input: '', expectedOutput: 'Hello World' }];
      
      const request: ExecutionRequest = {
        code: testCode,
        language: 'javascript',
        testCases,
        timeLimit: 5,
        memoryLimit: 64
      };

      const results = await this.executeCode(request);
      return results.length > 0 && results[0].success;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

export default CodeExecutionService;
export { ExecutionResult, TestCase, ExecutionRequest };