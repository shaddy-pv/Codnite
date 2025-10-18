const { testConnection, query } = require('./dist/utils/database.js');
const { config } = require('./dist/config/env.js');

async function testDatabase() {
  console.log('Testing database connection...');
  console.log('Database URL:', config.databaseUrl?.replace(/\/\/.*@/, '//***@'));
  
  try {
    // Test basic connection
    const isConnected = await testConnection();
    console.log('Connection test:', isConnected ? 'SUCCESS' : 'FAILED');
    
    if (isConnected) {
      // Test simple query
      const result = await query('SELECT COUNT(*) as count FROM users');
      console.log('Users count:', result.rows[0].count);
      
      // Test trending users query
      const trendingResult = await query(`
        SELECT 
          u.id, u.username, u.name, u.avatar_url, u.points,
          COUNT(DISTINCT p.id) as post_count,
          COUNT(DISTINCT s.id) as submission_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN submissions s ON u.id = s.user_id
        GROUP BY u.id, u.username, u.name, u.avatar_url, u.points
        ORDER BY u.points DESC, post_count DESC
        LIMIT 10
      `);
      console.log('Trending users query result:', trendingResult.rows.length, 'users found');
    }
  } catch (error) {
    console.error('Database test failed:', error);
  }
  
  process.exit(0);
}

testDatabase();
