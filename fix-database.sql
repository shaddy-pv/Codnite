-- Create challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20),
    category VARCHAR(50),
    tags TEXT[],
    test_cases JSONB,
    points INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS college_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS github_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

-- Add missing columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Insert sample challenges
INSERT INTO challenges (title, description, difficulty, points, start_date, end_date, created_at) VALUES
('JavaScript Fundamentals Challenge', 'Solve basic JavaScript problems including arrays, objects, and functions. Perfect for beginners!', 'easy', 50, NOW(), NOW() + INTERVAL '7 days', NOW()),
('Algorithm Mastery Contest', 'Advanced algorithmic problems including sorting, searching, and dynamic programming.', 'hard', 150, NOW(), NOW() + INTERVAL '14 days', NOW()),
('React Component Challenge', 'Build interactive React components with hooks and state management.', 'medium', 100, NOW() + INTERVAL '2 days', NOW() + INTERVAL '9 days', NOW()),
('Database Design Challenge', 'Design efficient database schemas and write optimized SQL queries.', 'medium', 120, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', NOW()),
('Python Data Science Challenge', 'Analyze datasets using pandas, numpy, and matplotlib. Perfect for data enthusiasts!', 'easy', 75, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT DO NOTHING;
