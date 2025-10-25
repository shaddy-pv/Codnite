import { query } from './database.js';
import { seedProblems, seedColleges, seedUsers } from './seed.js';

// Drop all tables and recreate with correct schema
export const resetDatabase = async (): Promise<void> => {
  try {
    console.log('Dropping existing tables...');
    
    // Drop tables in reverse order of dependencies
    await query('DROP TABLE IF EXISTS mentions CASCADE');
    await query('DROP TABLE IF EXISTS post_hashtags CASCADE');
    await query('DROP TABLE IF EXISTS hashtags CASCADE');
    await query('DROP TABLE IF EXISTS post_recommendations CASCADE');
    await query('DROP TABLE IF EXISTS user_recommendations CASCADE');
    await query('DROP TABLE IF EXISTS search_history CASCADE');
    await query('DROP TABLE IF EXISTS chat_room_members CASCADE');
    await query('DROP TABLE IF EXISTS chat_messages CASCADE');
    await query('DROP TABLE IF EXISTS chat_rooms CASCADE');
    await query('DROP TABLE IF EXISTS notifications CASCADE');
    await query('DROP TABLE IF EXISTS follows CASCADE');
    await query('DROP TABLE IF EXISTS likes CASCADE');
    await query('DROP TABLE IF EXISTS comments CASCADE');
    await query('DROP TABLE IF EXISTS submissions CASCADE');
    await query('DROP TABLE IF EXISTS problem_submissions CASCADE');
    await query('DROP TABLE IF EXISTS posts CASCADE');
    await query('DROP TABLE IF EXISTS challenges CASCADE');
    await query('DROP TABLE IF EXISTS problems CASCADE');
    await query('DROP TABLE IF EXISTS colleges CASCADE');
    await query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('Tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};

// SQL schema creation
export const createTables = async (): Promise<void> => {
  try {
    // Create Users table
    await query(`
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
      )
    `);

    // Create Posts table
    await query(`
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
      )
    `);

    // Create Challenges table
    await query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        points INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Problems table
    await query(`
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
        test_cases JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Problem Submissions table
    await query(`
      CREATE TABLE IF NOT EXISTS problem_submissions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        problem_id VARCHAR(36) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        runtime INTEGER DEFAULT 0,
        memory INTEGER DEFAULT 0,
        test_cases_passed INTEGER DEFAULT 0,
        total_test_cases INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Submissions table
    await query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id VARCHAR(36) NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Comments table
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        content TEXT NOT NULL,
        author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Likes table
    await query(`
      CREATE TABLE IF NOT EXISTS likes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
        comment_id VARCHAR(36) REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        UNIQUE(user_id, comment_id)
      )
    `);

    // Create Follows table for following/followers system
    await query(`
      CREATE TABLE IF NOT EXISTS follows (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        follower_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    // Create Notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Colleges table for college community pages
    await query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(50) NOT NULL,
        logo_url VARCHAR(500),
        location VARCHAR(255),
        rank INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Chat Rooms table for real-time chat
    await query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'public',
        college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
        created_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Chat Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Chat Room Members table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_room_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      )
    `);

    // Create Search History table for advanced search
    await query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        search_type VARCHAR(50) NOT NULL,
        filters JSONB DEFAULT '{}',
        results_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create User Recommendations table
    await query(`
      CREATE TABLE IF NOT EXISTS user_recommendations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recommended_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recommendation_type VARCHAR(50) NOT NULL,
        score DECIMAL(5,2) DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, recommended_user_id, recommendation_type)
      )
    `);

    // Create Post Recommendations table
    await query(`
      CREATE TABLE IF NOT EXISTS post_recommendations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        recommendation_type VARCHAR(50) NOT NULL,
        score DECIMAL(5,2) DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id, recommendation_type)
      )
    `);

    // Create Hashtags table for social features
    await query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(100) UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Post Hashtags junction table
    await query(`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id VARCHAR(36) NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, hashtag_id)
      )
    `);

    // Create Mentions table for social features
    await query(`
      CREATE TABLE IF NOT EXISTS mentions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
        comment_id VARCHAR(36) REFERENCES comments(id) ON DELETE CASCADE,
        mentioned_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentioned_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_points ON users(points)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_language ON posts(language)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_challenges_points ON challenges(points)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges(start_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at)`);

    // Create indexes for problems table
    await query(`CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problems_acceptance_rate ON problems(acceptance_rate)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN(tags)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problems_companies ON problems USING GIN(companies)`);

    // Create indexes for problem_submissions table
    await query(`CREATE INDEX IF NOT EXISTS idx_problem_submissions_user_id ON problem_submissions(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problem_submissions_problem_id ON problem_submissions(problem_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problem_submissions_status ON problem_submissions(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_problem_submissions_created_at ON problem_submissions(created_at)`);

    // Indexes for community features
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_colleges_short_name ON colleges(short_name)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_colleges_rank ON colleges(rank)`);
    
    // Indexes for chat system
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_rooms_college_id ON chat_rooms(college_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_room_members_role ON chat_room_members(role)`);
    
    // Indexes for search and recommendations
    await query(`CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_search_history_search_type ON search_history(search_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_recommendations_type ON user_recommendations(recommendation_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(score)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_post_recommendations_user_id ON post_recommendations(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_post_recommendations_type ON post_recommendations(recommendation_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_post_recommendations_score ON post_recommendations(score)`);
    
    // Indexes for social features
    await query(`CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON mentions(mentioned_user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_by ON mentions(mentioned_by)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_mentions_comment_id ON mentions(comment_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(score)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at)`);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Reset database first to fix schema issues
    await resetDatabase();
    await createTables();
    
    // Seed sample data
    await seedProblems();
    await seedColleges();
    await seedUsers();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};
