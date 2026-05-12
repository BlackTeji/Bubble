import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const ensureMigrationsTable = async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getApplied = async () => {
    const { rows } = await pool.query('SELECT filename FROM _migrations ORDER BY id');
    return new Set(rows.map(r => r.filename));
};

const runMigrations = async () => {
    await ensureMigrationsTable();
    const applied = await getApplied();

    const files = (await readdir(MIGRATIONS_DIR))
        .filter(f => f.endsWith('.sql'))
        .sort();

    let ran = 0;

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`[migrate] Applied: ${file}`);
            ran++;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`[migrate] Failed on ${file}:`, err.message);
            throw err;
        } finally {
            client.release();
        }
    }

    if (ran === 0) {
        console.log('[migrate] All migrations already applied.');
    } else {
        console.log(`[migrate] Applied ${ran} migration(s).`);
    }
};

runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));