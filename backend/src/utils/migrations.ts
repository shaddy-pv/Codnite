import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../migrations');

export async function getMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(migrationsDir);
  const migrationFiles = files.filter(file => file.match(/^\d{14}_.*\.sql$/));

  const migrations: Migration[] = [];
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const [id, name] = file.split('_', 2);
    const [up, down] = content.split('-- DOWN');

    if (!up || !down) {
      throw new Error(`Migration file ${file} is not correctly formatted. It must contain '-- DOWN' separator.`);
    }

    migrations.push({
      id,
      name: name.replace('.sql', ''),
      up: up.trim(),
      down: down.trim(),
    });
  }
  // Sort migrations by ID to ensure correct order
  return migrations.sort((a, b) => parseInt(a.id) - parseInt(b.id));
}
