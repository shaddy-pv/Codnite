/**
 * Migration Registry
 * 
 * This file tracks all database migrations in order.
 * Each migration should have:
 * - version: Sequential number (001, 002, etc.)
 * - name: Descriptive name
 * - up: SQL to apply the migration
 * - down: SQL to rollback the migration
 */

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
}

export const migrations: Migration[] = [
  {
    version: '001',
    name: 'initial_schema',
    up: `
      -- Create migrations table to track applied migrations
      CREATE TABLE IF NOT EXISTS migrations (
        version VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Users table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        github_username VARCHAR(100),
        linkedin_url VARCHAR(500),
        college_id VARCHAR(50),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Colleges table
      CREATE TABLE IF NOT EXISTS colleges (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(100),
        logo_url VARCHAR(500),
        website VARCHAR(500),
        location VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        rank INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Problems table
      CREATE TABLE IF NOT EXISTS problems (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        acceptance_rate DECIMAL(5,2) DEFAULT 0,
        examples JSONB DEFAULT '[]',
        constraints TEXT[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        companies TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Challenges table
      CREATE TABLE IF NOT EXISTS challenges (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        points INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Posts table
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        code TEXT,
        language VARCHAR(50),
        author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        content TEXT NOT NULL,
        author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
        challenge_id VARCHAR(36) REFERENCES challenges(id) ON DELETE CASCADE,
        parent_id VARCHAR(36) REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Likes table
      CREATE TABLE IF NOT EXISTS likes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
        comment_id VARCHAR(36) REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        UNIQUE(user_id, comment_id)
      );

      -- Create Follows table
      CREATE TABLE IF NOT EXISTS follows (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        follower_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );

      -- Create Submissions table
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id VARCHAR(36) NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        score INTEGER DEFAULT 0,
        execution_time INTEGER DEFAULT 0,
        memory_usage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Problem Submissions table
      CREATE TABLE IF NOT EXISTS problem_submissions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        problem_id VARCHAR(36) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        score INTEGER DEFAULT 0,
        execution_time INTEGER DEFAULT 0,
        memory_usage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Chat Rooms table
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Chat Messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Chat Room Members table
      CREATE TABLE IF NOT EXISTS chat_room_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      );

      -- Create Search History table
      CREATE TABLE IF NOT EXISTS search_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        query VARCHAR(255) NOT NULL,
        results_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create User Recommendations table
      CREATE TABLE IF NOT EXISTS user_recommendations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recommended_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score DECIMAL(5,2) DEFAULT 0,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Post Recommendations table
      CREATE TABLE IF NOT EXISTS post_recommendations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        score DECIMAL(5,2) DEFAULT 0,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Hashtags table
      CREATE TABLE IF NOT EXISTS hashtags (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(100) UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create Post Hashtags junction table
      CREATE TABLE IF NOT EXISTS post_hashtags (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id VARCHAR(36) NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, hashtag_id)
      );

      -- Create Mentions table
      CREATE TABLE IF NOT EXISTS mentions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        mentioned_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, mentioned_user_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
      CREATE INDEX IF NOT EXISTS idx_problem_submissions_user_id ON problem_submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_problem_submissions_problem_id ON problem_submissions(problem_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
      CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
      CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id);
      CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON mentions(mentioned_user_id);
    `,
    down: `
      -- Drop tables in reverse order of dependencies
      DROP TABLE IF EXISTS mentions CASCADE;
      DROP TABLE IF EXISTS post_hashtags CASCADE;
      DROP TABLE IF EXISTS hashtags CASCADE;
      DROP TABLE IF EXISTS post_recommendations CASCADE;
      DROP TABLE IF EXISTS user_recommendations CASCADE;
      DROP TABLE IF EXISTS search_history CASCADE;
      DROP TABLE IF EXISTS chat_room_members CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS chat_rooms CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS follows CASCADE;
      DROP TABLE IF EXISTS likes CASCADE;
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS submissions CASCADE;
      DROP TABLE IF EXISTS problem_submissions CASCADE;
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS challenges CASCADE;
      DROP TABLE IF EXISTS problems CASCADE;
      DROP TABLE IF EXISTS colleges CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS migrations CASCADE;
    `
  }
];

export default migrations;
