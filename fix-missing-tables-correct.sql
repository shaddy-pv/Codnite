-- Create missing tables for Codnite API with correct data types

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    test_results JSONB,
    execution_time INTEGER,
    memory_usage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create follows table with correct data types
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    following_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- Create likes table with correct data types
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- Create mentions table with correct data types
CREATE TABLE IF NOT EXISTS mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    mentioned_by VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data for testing
INSERT INTO colleges (id, name, short_name, description) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Massachusetts Institute of Technology', 'MIT', 'A private research university in Cambridge, Massachusetts'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Stanford University', 'Stanford', 'A private research university in Stanford, California'),
    ('550e8400-e29b-41d4-a716-446655440002', 'University of California, Berkeley', 'UC Berkeley', 'A public research university in Berkeley, California')
ON CONFLICT (short_name) DO NOTHING;

-- Insert a sample user for testing
INSERT INTO users (id, username, email, password, name, college_id) VALUES 
    ('user123', 'testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.8.8.8', 'Test User', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (username) DO NOTHING;
