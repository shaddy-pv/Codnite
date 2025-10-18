-- UP: Fix search_history table to allow null user_id
ALTER TABLE search_history ALTER COLUMN user_id DROP NOT NULL;

-- DOWN: Revert search_history table to require user_id
-- ALTER TABLE search_history ALTER COLUMN user_id SET NOT NULL;
