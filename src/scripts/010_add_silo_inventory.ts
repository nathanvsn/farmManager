
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function addSiloInventory() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Adding silo_inventory column to users table...');
        await client.query('BEGIN');

        // Add silo_inventory JSONB column
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='silo_inventory'
                ) THEN
                    ALTER TABLE users ADD COLUMN silo_inventory JSONB DEFAULT '{"seeds": {}, "produce": {}}'::jsonb;
                    RAISE NOTICE 'Column silo_inventory added successfully';
                ELSE
                    RAISE NOTICE 'Column silo_inventory already exists';
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

addSiloInventory();
