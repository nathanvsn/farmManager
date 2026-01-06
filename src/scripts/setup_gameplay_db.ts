
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function setupGameplay() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Beginning gameplay migration...');
        await client.query('BEGIN');

        // 1. Game Items Table (Static Catalog)
        console.log('Creating game_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL CHECK (type IN ('tractor', 'implement', 'heavy', 'seed', 'produce')),
                category VARCHAR(50), -- e.g., 'plow', 'seeder', 'soybean'
                price NUMERIC(15, 2) NOT NULL,
                image_url TEXT,
                description TEXT,
                stats JSONB DEFAULT '{}'::jsonb
            );
        `);

        // 2. Inventory Table (User Items)
        console.log('Creating inventory table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                item_id INTEGER REFERENCES game_items(id),
                quantity NUMERIC(15, 2) DEFAULT 1, -- For stackable items like seeds (kg)
                instance_id UUID DEFAULT gen_random_uuid(), -- Unique ID for machinery
                attached_to UUID, -- If implement is attached to a tractor (instance_id) is stored here
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Update Lands Table
        console.log('Updating lands table...');
        await client.query(`
            DO $$ 
            BEGIN 
                -- current_crop_id
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='current_crop_id') THEN
                    ALTER TABLE lands ADD COLUMN current_crop_id INTEGER REFERENCES game_items(id);
                END IF;

                -- operation_start
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_start') THEN
                    ALTER TABLE lands ADD COLUMN operation_start TIMESTAMP;
                END IF;

                -- operation_end
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_end') THEN
                    ALTER TABLE lands ADD COLUMN operation_end TIMESTAMP;
                END IF;

                -- operation_type
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_type') THEN
                    ALTER TABLE lands ADD COLUMN operation_type VARCHAR(50); 
                    -- e.g. cleaning, plowing, sowing, growing, harvesting
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Gameplay migration completed successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

setupGameplay();
