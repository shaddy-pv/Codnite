import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    // Check if challenges table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenges'
      );
    `);
    
    console.log('Challenges table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check table structure
      const structure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'challenges'
        ORDER BY ordinal_position;
      `);
      
      console.log('Challenges table structure:');
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
      
      // Try to select from challenges
      const challenges = await pool.query('SELECT COUNT(*) FROM challenges');
      console.log('Number of challenges:', challenges.rows[0].count);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
