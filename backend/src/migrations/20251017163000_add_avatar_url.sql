-- UP
-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) DEFAULT '/default-avatar.svg';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);

-- DOWN
-- Remove avatar_url column and index
DROP INDEX IF EXISTS idx_users_avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
