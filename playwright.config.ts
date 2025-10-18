import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * 
 * This file configures Playwright for end-to-end testing.
 * It provides:
 * - Test directory configuration
 * - Browser configuration
 * - Test environment setup
 * - Test data management
 * - Test reporting
 */

export default defineConfig({
  // Test directory
  testDir: './backend/tests/e2e',
  
  // Test file patterns
  testMatch: [
    '**/e2e/**/*.test.ts',
    '**/e2e/**/*.spec.ts',
  ],
  
  // Test timeout
  timeout: 30000,
  
  // Test retries
  retries: process.env.CI ? 2 : 0,
  
  // Test workers
  workers: process.env.CI ? 1 : undefined,
  
  // Test reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  
  // Test use configuration
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Test data
    testDataDir: './backend/tests/e2e/test-data',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Video
    video: 'retain-on-failure',
    
    // Trace
    trace: 'on-first-retry',
  },
  
  // Test projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Test web server
  webServer: {
    command: 'npm run start:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Test global setup
  globalSetup: require.resolve('./backend/tests/e2e/global-setup.ts'),
  
  // Test global teardown
  globalTeardown: require.resolve('./backend/tests/e2e/global-teardown.ts'),
  
  // Test setup
  setup: require.resolve('./backend/tests/e2e/setup.ts'),
  
  // Test teardown
  teardown: require.resolve('./backend/tests/e2e/teardown.ts'),
  
  // Test expect configuration
  expect: {
    // Assertion timeout
    timeout: 5000,
    
    // Screenshot threshold
    threshold: 0.2,
    
    // Animation threshold
    animation: 'disabled',
  },
  
  // Test output directory
  outputDir: 'test-results/',
  
  // Test preserve output
  preserveOutput: 'always',
  
  // Test forbid only
  forbidOnly: !!process.env.CI,
  
  // Test fully parallel
  fullyParallel: true,
  
  // Test max failures
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Test update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  
  // Test grep
  grep: process.env.TEST_GREP,
  
  // Test grep invert
  grepInvert: process.env.TEST_GREP_INVERT,
  
  // Test dependencies
  dependencies: [
    'setup',
  ],
  
  // Test metadata
  metadata: {
    testEnvironment: 'e2e',
    testType: 'integration',
    testFramework: 'playwright',
  },
});