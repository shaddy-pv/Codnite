#!/usr/bin/env node

import { query } from './database';
import logger from './logger';

async function fixExistingDatabase() {
  try {
    logger.info('Fixing migration system for existing database...');
    
    // Check if migrations table exists
    let migrationsTableExists = false;
    try {
      await query('SELECT 1 FROM migrations LIMIT 1');
      migrationsTableExists = true;
      logger.info('Migrations table already exists');
    } catch (error) {
      if (error.code === '42P01') { // Table doesn't exist
        logger.info('Migrations table does not exist, creating it...');
      } else {
        throw error;
      }
    }
    
    if (!migrationsTableExists) {
      // Create migrations table with correct field sizes
      await query(`
        CREATE TABLE migrations (
          id VARCHAR(20) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Migrations table created successfully');
    }
    
    // Check if initial migration is already recorded
    const existingMigration = await query(
      'SELECT id FROM migrations WHERE id = $1',
      ['20241201120000']
    );
    
    if (existingMigration.rows.length === 0) {
      // Mark the existing migration as applied without running it
      await query(`
        INSERT INTO migrations (id, name, applied_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, ['20241201120000', 'initial_schema']);
      logger.info('Marked initial migration as applied');
    } else {
      logger.info('Initial migration already marked as applied');
    }
    
    // Verify the migration was recorded
    const migrations = await query('SELECT * FROM migrations ORDER BY applied_at');
    logger.info('Current migrations:', migrations.rows);
    
    logger.info('Database migration fix completed successfully!');
    
  } catch (error) {
    logger.error('Failed to fix database migrations:', error);
    process.exit(1);
  }
}

// Run the fix
fixExistingDatabase();
