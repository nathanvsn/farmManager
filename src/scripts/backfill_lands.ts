
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function backfill() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Fetching lands to backfill...');
        const res = await client.query('SELECT id, area_sqm FROM lands WHERE condition IS NULL OR price IS NULL OR status IS NULL');

        console.log(`Found ${res.rowCount} lands to update.`);

        await client.query('BEGIN');

        for (const row of res.rows) {
            let condition = 'bruto';
            let priceMultiplier = 1.0;
            const rand = Math.random();

            if (rand < 0.70) {
                condition = 'bruto';
                priceMultiplier = 1.0;
            } else if (rand < 0.90) {
                condition = 'limpo';
                priceMultiplier = 1.15;
            } else {
                condition = 'arado';
                priceMultiplier = 1.35;
            }

            const basePricePerSqm = 0.5;
            const initialPrice = parseFloat(row.area_sqm) * basePricePerSqm * priceMultiplier;

            await client.query(`
                UPDATE lands 
                SET condition = $1, price = $2, status = COALESCE(status, 'disponivel')
                WHERE id = $3
             `, [condition, initialPrice, row.id]);
        }

        await client.query('COMMIT');
        console.log('Backfill completed successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Backfill failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

backfill();
