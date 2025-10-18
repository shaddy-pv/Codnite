-- Migration: Create execution system tables
-- Description: Creates tables for code submissions, test results, and execution tracking

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, error
    score DECIMAL(5,2) DEFAULT 0,
    execution_time INTEGER DEFAULT 0, -- in milliseconds
    memory_usage INTEGER DEFAULT 0, -- in KB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create submission test results table
CREATE TABLE IF NOT EXISTS submission_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    test_case_id VARCHAR(50) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT false,
    output TEXT,
    error TEXT,
    execution_time INTEGER DEFAULT 0, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge submissions table
CREATE TABLE IF NOT EXISTS challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    rank INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create execution logs table for debugging
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL, -- info, warn, error
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_submission_test_results_submission_id ON submission_test_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_test_results_passed ON submission_test_results(passed);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_id ON challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_score ON challenge_submissions(score);

CREATE INDEX IF NOT EXISTS idx_execution_logs_submission_id ON execution_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON execution_logs(level);

-- Add constraints
ALTER TABLE submissions ADD CONSTRAINT chk_submissions_status 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'error'));

ALTER TABLE submissions ADD CONSTRAINT chk_submissions_score 
    CHECK (score >= 0 AND score <= 100);

ALTER TABLE submissions ADD CONSTRAINT chk_submissions_execution_time 
    CHECK (execution_time >= 0);

ALTER TABLE submission_test_results ADD CONSTRAINT chk_submission_test_results_execution_time 
    CHECK (execution_time >= 0);

ALTER TABLE challenge_submissions ADD CONSTRAINT chk_challenge_submissions_score 
    CHECK (score >= 0 AND score <= 100);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add sample test cases to existing problems
UPDATE problems 
SET test_cases = '[
    {
        "id": "test1",
        "input": "hello world",
        "expectedOutput": "hello world",
        "description": "Basic string test"
    },
    {
        "id": "test2", 
        "input": "42",
        "expectedOutput": "42",
        "description": "Number test"
    }
]'::jsonb
WHERE test_cases IS NULL;

-- Add time and memory limits to problems
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS memory_limit INTEGER DEFAULT 64;

-- Add constraints for limits
ALTER TABLE problems ADD CONSTRAINT chk_problems_time_limit 
    CHECK (time_limit > 0 AND time_limit <= 30);

ALTER TABLE problems ADD CONSTRAINT chk_problems_memory_limit 
    CHECK (memory_limit > 0 AND memory_limit <= 128);
