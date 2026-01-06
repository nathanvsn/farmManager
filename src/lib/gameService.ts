import { query, transaction } from '@/lib/db';

export async function calculateDynamicPrice(landId: string | number) {
    // 1. Get base land info
    const landRes = await query('SELECT price, geom FROM lands WHERE id = $1', [landId]);
    if (landRes.rows.length === 0) return null;
    const land = landRes.rows[0];
    const basePrice = parseFloat(land.price);

    // 2. Count sold neighbors within 50km
    // Using cast to geography for meters calculation
    const neighborsRes = await query(`
        SELECT COUNT(*) as count 
        FROM lands 
        WHERE status = 'comprado' 
        AND ST_DWithin(
            geom::geography, 
            (SELECT geom::geography FROM lands WHERE id = $1), 
            50000 -- 50km
        )
        AND id != $1
    `, [landId]);

    const soldNeighbors = parseInt(neighborsRes.rows[0].count);

    // 3. Dynamic Calculation
    // Example: 1% increase per sold neighbor
    const demandMultiplier = 1 + (soldNeighbors * 0.01);

    // Cap at say 300% (3x) to avoid absurdity
    const cappedMultiplier = Math.min(demandMultiplier, 3.0);

    return {
        basePrice,
        finalPrice: basePrice * cappedMultiplier,
        demandMultiplier: cappedMultiplier,
        soldNeighbors
    };
}

export async function buyLand(userId: number, landId: string | number) {
    return await transaction(async (client) => {
        // 1. Get Land with Dynamic Price (Using client if you want read consistency, but global query is okay too if phantom reads aren't critical. 
        // Ideally we should use client for everything to be in same snapshot, but calculateDynamicPrice uses pool.query. Keeping it simple for now as pricing fluctuation is acceptable)
        const priceData = await calculateDynamicPrice(landId);
        if (!priceData) throw new Error('Land not found');
        const price = priceData.finalPrice;

        // 2. Get User (Use transaction client!)
        const userRes = await client.query('SELECT money FROM users WHERE id = $1 FOR UPDATE', [userId]); // Lock user row
        const user = userRes.rows[0];
        if (!user) throw new Error('User not found');

        if (parseFloat(user.money) < price) {
            throw new Error('Insufficient funds');
        }

        // 3. Check if Land is available (Use transaction client!)
        const statusRes = await client.query("SELECT status FROM lands WHERE id = $1 FOR UPDATE", [landId]); // Lock land row
        if (statusRes.rows.length === 0) throw new Error('Land not found');
        if (statusRes.rows[0].status !== 'disponivel') {
            throw new Error('Land already owned');
        }

        // 4. Perform Transaction
        // Deduct money
        await client.query('UPDATE users SET money = money - $1 WHERE id = $2', [price, userId]);

        // Transfer ownership
        await client.query(`
            UPDATE lands 
            SET owner_id = $1, status = 'comprado', price = $2 
            WHERE id = $3
        `, [userId, price, landId]);

        return { success: true, pricePaid: price };
    });
}
