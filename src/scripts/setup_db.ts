
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function setup() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Beginning database migration...');
        await client.query('BEGIN');

        // Create Users Table
        console.log('Creating users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nickname VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                money NUMERIC(15, 2) DEFAULT 200000,
                diamonds INTEGER DEFAULT 200,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Update Lands Table
        console.log('Updating lands table...');
        // Add columns if they don't exist
        await client.query(`
            DO $$ 
            BEGIN 
                -- owner_id
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='owner_id') THEN
                    ALTER TABLE lands ADD COLUMN owner_id INTEGER REFERENCES users(id);
                END IF;

                -- price
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='price') THEN
                    ALTER TABLE lands ADD COLUMN price NUMERIC(15, 2);
                END IF;

                -- condition
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='condition') THEN
                    ALTER TABLE lands ADD COLUMN condition VARCHAR(20) CHECK (condition IN ('bruto', 'limpo', 'arado'));
                END IF;

                -- status
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='status') THEN
                    ALTER TABLE lands ADD COLUMN status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprado'));
                END IF;

                -- created_at (just in case)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='created_at') THEN
                    ALTER TABLE lands ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
