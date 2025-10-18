#!/usr/bin/env node

import MigrationRunner, { runMigrations, rollbackMigrations, getMigrationStatus } from './migrate';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'up':
      await runMigrations();
      break;
    case 'down':
      await rollbackMigrations();
      break;
    case 'status':
      await getMigrationStatus();
      break;
    case 'create':
      const name = process.argv[3];
      if (!name) {
        console.error('Usage: npm run migrate:create <migration-name>');
        process.exit(1);
      }
      const runner = MigrationRunner.getInstance();
      const fileName = await runner.createMigration(name);
      console.log(`Migration template created: ${fileName}`);
      break;
    default:
      console.log('Usage: npm run migrate <command>');
      console.log('Commands:');
      console.log('  up     - Apply all pending migrations');
      console.log('  down   - Rollback the last migration');
      console.log('  status - Show migration status');
      console.log('  create - Create a new migration template');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Migration command failed:', error);
  process.exit(1);
});
