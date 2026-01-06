import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

async function updateLandsConditionConstraint() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Updating lands condition constraint...');
        await client.query('BEGIN');

        // Drop old constraint
        await client.query(`
            ALTER TABLE lands DROP CONSTRAINT IF EXISTS lands_condition_check;
        `);

        // Add new constraint with 'growing' and 'mature'
        await client.query(`
            ALTER TABLE lands ADD CONSTRAINT lands_condition_check 
            CHECK (condition IN ('bruto', 'limpo', 'arado', 'growing', 'mature'));
        `);

        await client.query('COMMIT');
        console.log('Constraint updated successfully. Now allows: bruto, limpo, arado, growing, mature');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

updateLandsConditionConstraint();
