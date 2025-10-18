import { Pool } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixDatabase() {
  try {
    console.log('Fixing database...');
    
    // Read the SQL file
    const sql = fs.readFileSync('fix-database.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Database fixed successfully!');
    
    // Test the challenges table
    const result = await pool.query('SELECT COUNT(*) FROM challenges');
    console.log(`Number of challenges: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase();
