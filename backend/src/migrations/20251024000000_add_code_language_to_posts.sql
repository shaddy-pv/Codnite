-- UP
-- Add code and language columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'javascript';

-- DOWN
-- Remove added columns
ALTER TABLE posts DROP COLUMN IF EXISTS code;
ALTER TABLE posts DROP COLUMN IF EXISTS language;