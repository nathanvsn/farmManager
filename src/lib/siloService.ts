
import { query, transaction } from '@/lib/db';

export async function getSiloInventory(userId: number) {
    const result = await query(`
        SELECT silo_inventory FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
        throw new Error('User not found');
    }

    const siloData = result.rows[0].silo_inventory || { seeds: {}, produce: {} };

    // Enrich with game_items data
    const seedIds = Object.keys(siloData.seeds || {});
    const produceIds = Object.keys(siloData.produce || {});

    let enrichedSeeds = [];
    let enrichedProduce = [];

    if (seedIds.length > 0) {
        const seedsRes = await query(`
            SELECT id, name, image_url, category, stats 
            FROM game_items 
            WHERE id = ANY($1)
        `, [seedIds.map(Number)]);

        enrichedSeeds = seedsRes.rows.map(item => ({
            ...item,
            quantity: siloData.seeds[item.id] || 0
        }));
    }

    if (produceIds.length > 0) {
        const produceRes = await query(`
            SELECT id, name, image_url, category, stats 
            FROM game_items 
            WHERE id = ANY($1)
        `, [produceIds.map(Number)]);

        enrichedProduce = produceRes.rows.map(item => ({
            ...item,
            quantity: siloData.produce[item.id] || 0
        }));
    }

    return {
        seeds: enrichedSeeds,
        produce: enrichedProduce
    };
}

export async function addToSilo(
    userId: number,
    type: 'seeds' | 'produce',
    itemId: number,
    quantity: number
) {
    return await transaction(async (client) => {
        const result = await client.query(
            'SELECT silo_inventory FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );

        const silo = result.rows[0]?.silo_inventory || { seeds: {}, produce: {} };

        if (!silo[type]) {
            silo[type] = {};
        }

        const currentQty = silo[type][itemId] || 0;
        silo[type][itemId] = currentQty + quantity;

        await client.query(
            'UPDATE users SET silo_inventory = $1 WHERE id = $2',
            [JSON.stringify(silo), userId]
        );

        return { success: true, newQuantity: silo[type][itemId] };
    });
}

export async function removeFromSilo(
    userId: number,
    type: 'seeds' | 'produce',
    itemId: number,
    quantity: number
) {
    return await transaction(async (client) => {
        const result = await client.query(
            'SELECT silo_inventory FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );

        const silo = result.rows[0]?.silo_inventory || { seeds: {}, produce: {} };

        const currentQty = silo[type]?.[itemId] || 0;

        if (currentQty < quantity) {
            throw new Error(`Quantidade insuficiente no silo. Disponível: ${currentQty}kg, Necessário: ${quantity}kg`);
        }

        silo[type][itemId] = currentQty - quantity;

        // Remove entry if quantity is 0
        if (silo[type][itemId] === 0) {
            delete silo[type][itemId];
        }

        await client.query(
            'UPDATE users SET silo_inventory = $1 WHERE id = $2',
            [JSON.stringify(silo), userId]
        );

        return { success: true, newQuantity: silo[type][itemId] || 0 };
    });
}

export async function checkSiloQuantity(
    userId: number,
    type: 'seeds' | 'produce',
    itemId: number
): Promise<number> {
    const result = await query(
        'SELECT silo_inventory FROM users WHERE id = $1',
        [userId]
    );

    const silo = result.rows[0]?.silo_inventory || { seeds: {}, produce: {} };
    return silo[type]?.[itemId] || 0;
}
