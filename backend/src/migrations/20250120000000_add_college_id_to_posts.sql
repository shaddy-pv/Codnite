-- UP
-- Add college_id column to posts table to distinguish between main feed and college-specific posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS college_id VARCHAR(50) REFERENCES colleges(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_college_id ON posts(college_id);

-- DOWN
-- Remove college_id column and index
DROP INDEX IF EXISTS idx_posts_college_id;
ALTER TABLE posts DROP COLUMN IF EXISTS college_id;
