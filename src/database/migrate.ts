import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

interface Migration {
    filename: string;
    sql: string;
}

async function createMigrationsTable(client: any) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

async function getExecutedMigrations(client: any): Promise<string[]> {
    const result = await client.query('SELECT filename FROM _migrations ORDER BY filename');
    return result.rows.map((row: any) => row.filename);
}

async function recordMigration(client: any, filename: string) {
    await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [filename]);
}

async function loadMigrations(): Promise<Migration[]> {
    const migrationsDir = join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Alphabetical order (e.g., 001_, 002_, etc.)

    return files.map(filename => ({
        filename,
        sql: readFileSync(join(migrationsDir, filename), 'utf-8')
    }));
}

async function runMigrations() {
    console.log('🚀 Starting database migration...\n');

    const client = await pool.connect();

    try {
        // Create migrations tracking table
        await createMigrationsTable(client);

        // Get list of already executed migrations
        const executedMigrations = await getExecutedMigrations(client);
        console.log(`📋 Found ${executedMigrations.length} previously executed migration(s)\n`);

        // Load all migration files
        const allMigrations = await loadMigrations();
        console.log(`📁 Found ${allMigrations.length} migration file(s)\n`);

        // Filter pending migrations
        const pendingMigrations = allMigrations.filter(
            m => !executedMigrations.includes(m.filename)
        );

        if (pendingMigrations.length === 0) {
            console.log('✅ All migrations are up to date! Nothing to do.\n');
            return;
        }

        console.log(`⏳ Running ${pendingMigrations.length} pending migration(s)...\n`);

        // Execute pending migrations
        for (const migration of pendingMigrations) {
            console.log(`   → ${migration.filename}`);

            try {
                await client.query('BEGIN');
                await client.query(migration.sql);
                await recordMigration(client, migration.filename);
                await client.query('COMMIT');

                console.log(`   ✓ ${migration.filename} completed\n`);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`   ✗ ${migration.filename} failed:`);
                throw error;
            }
        }

        console.log('🎉 All migrations completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations
runMigrations().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
