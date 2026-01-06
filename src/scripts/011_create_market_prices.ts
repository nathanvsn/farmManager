
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function createMarketPrices() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Creating market_prices table...');
        await client.query('BEGIN');

        // Create market_prices table
        await client.query(`
            CREATE TABLE IF NOT EXISTS market_prices (
                id SERIAL PRIMARY KEY,
                item_id INTEGER REFERENCES game_items(id) UNIQUE,
                base_price DECIMAL(10, 2) NOT NULL,
                current_price DECIMAL(10, 2) NOT NULL,
                trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
                last_update TIMESTAMP DEFAULT NOW()
            );
        `);

        // Populate with initial prices from seeds
        console.log('Populating initial market prices...');
        await client.query(`
            INSERT INTO market_prices (item_id, base_price, current_price, trend)
            SELECT 
                id,
                (stats->>'sell_price')::decimal,
                (stats->>'sell_price')::decimal,
                'stable'
            FROM game_items
            WHERE type = 'seed' AND stats->>'sell_price' IS NOT NULL
            ON CONFLICT (item_id) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log('Market prices table created and populated successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

createMarketPrices();
