import { query, transaction } from '../utils/database';
import { getMigrations, Migration } from './migrations';
import logger from '../utils/logger';

export class MigrationRunner {
  private static instance: MigrationRunner;

  public static getInstance(): MigrationRunner {
    if (!MigrationRunner.instance) {
      MigrationRunner.instance = new MigrationRunner();
    }
    return MigrationRunner.instance;
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<string[]> {
    try {
      const result = await query('SELECT id FROM migrations ORDER BY id');
      return result.rows.map(row => row.id);
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      if (error.code === '42P01') { // Table doesn't exist
        return [];
      }
      throw error;
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await getMigrations();
    return availableMigrations.filter(migration => !appliedMigrations.includes(migration.id));
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    try {
      await transaction(async (client) => {
        logger.info(`Applying migration ${migration.id}: ${migration.name}`);
        
        // Execute the migration SQL
        await client.query(migration.up);
        
        // Record the migration as applied
        await client.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
        
        logger.info(`Migration ${migration.id} applied successfully`);
      });
    } catch (error) {
      logger.error(`Failed to apply migration ${migration.id}:`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    try {
      await transaction(async (client) => {
        logger.info(`Rolling back migration ${migration.id}: ${migration.name}`);
        
        // Execute the rollback SQL
        await client.query(migration.down);
        
        // Remove the migration record
        await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
        
        logger.info(`Migration ${migration.id} rolled back successfully`);
      });
    } catch (error) {
      logger.error(`Failed to rollback migration ${migration.id}:`, error);
      throw error;
    }
  }

  /**
   * Apply all pending migrations
   */
  async migrateUp(): Promise<void> {
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }

    logger.info('All migrations applied successfully');
  }

  /**
   * Rollback the last applied migration
   */
  async migrateDown(): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const lastMigrationId = appliedMigrations[appliedMigrations.length - 1];
    const availableMigrations = await getMigrations();
    const migration = availableMigrations.find(m => m.id === lastMigrationId);
    
    if (!migration) {
      throw new Error(`Migration ${lastMigrationId} not found in registry`);
    }

    await this.rollbackMigration(migration);
  }

  /**
   * Rollback all migrations
   */
  async migrateDownAll(): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${appliedMigrations.length} migrations`);

    // Rollback in reverse order
    const availableMigrations = await getMigrations();
    for (let i = appliedMigrations.length - 1; i >= 0; i--) {
      const migrationId = appliedMigrations[i];
      const migration = availableMigrations.find(m => m.id === migrationId);
      
      if (migration) {
        await this.rollbackMigration(migration);
      }
    }

    logger.info('All migrations rolled back successfully');
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: string[];
    pending: string[];
    total: number;
  }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = await this.getPendingMigrations();
    
    return {
      applied: appliedMigrations,
      pending: pendingMigrations.map(m => m.id),
      total: appliedMigrations.length + pendingMigrations.length
    };
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const fileName = `${timestamp}_${name}.sql`;
    
    logger.info(`Created migration template: ${fileName}`);
    
    return fileName;
  }

  /**
   * Check if migrations table exists and create it if not
   */
  async ensureMigrationsTable(): Promise<void> {
    try {
      await query('SELECT 1 FROM migrations LIMIT 1');
    } catch (error) {
      if (error.code === '42P01') { // Table doesn't exist
        logger.info('Creating migrations table');
        await query(`
          CREATE TABLE migrations (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        throw error;
      }
    }
  }
}

// CLI interface for running migrations
export async function runMigrations(): Promise<void> {
  const runner = MigrationRunner.getInstance();
  
  try {
    await runner.ensureMigrationsTable();
    await runner.migrateUp();
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

export async function rollbackMigrations(): Promise<void> {
  const runner = MigrationRunner.getInstance();
  
  try {
    await runner.migrateDown();
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

export async function getMigrationStatus(): Promise<void> {
  const runner = MigrationRunner.getInstance();
  
  try {
    const status = await runner.getStatus();
    console.log('Migration Status:');
    console.log(`Applied: ${status.applied.length}/${status.total}`);
    console.log(`Pending: ${status.pending.length}`);
    
    if (status.applied.length > 0) {
      console.log('Applied migrations:', status.applied.join(', '));
    }
    
    if (status.pending.length > 0) {
      console.log('Pending migrations:', status.pending.join(', '));
    }
  } catch (error) {
    logger.error('Failed to get migration status:', error);
    process.exit(1);
  }
}

export default MigrationRunner;
