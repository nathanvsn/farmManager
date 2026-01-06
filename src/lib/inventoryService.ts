
import { query, transaction } from '@/lib/db';

export async function getInventory(userId: number) {
    const res = await query(`
        SELECT 
            i.id, 
            i.quantity, 
            i.instance_id, 
            i.attached_to,
            g.id as item_id,
            g.name, 
            g.type, 
            g.category, 
            g.image_url, 
            g.stats,
            g.description
        FROM inventory i
        JOIN game_items g ON i.item_id = g.id
        WHERE i.user_id = $1
        ORDER BY g.type, g.name
    `, [userId]);

    return res.rows;
}

export async function buyItem(userId: number, itemId: number, quantity: number = 1) {
    return await transaction(async (client) => {
        // 1. Get Item Info
        const itemRes = await client.query('SELECT * FROM game_items WHERE id = $1', [itemId]);
        if (itemRes.rows.length === 0) throw new Error('Item not found');
        const item = itemRes.rows[0];

        const totalCost = parseFloat(item.price) * quantity;

        // 2. Check Funds
        const userRes = await client.query('SELECT money FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const user = userRes.rows[0];

        if (parseFloat(user.money) < totalCost) {
            throw new Error('Saldo insuficiente');
        }

        // 3. Deduct Money
        await client.query('UPDATE users SET money = money - $1 WHERE id = $2', [totalCost, userId]);

        // 4. Add to Inventory (for backward compatibility)
        if (['tractor', 'implement', 'heavy'].includes(item.type)) {
            // Machines are unique instances
            for (let i = 0; i < quantity; i++) {
                await client.query(`
                    INSERT INTO inventory (user_id, item_id, quantity)
                    VALUES ($1, $2, 1)
                `, [userId, itemId]);
            }
        } else {
            // Seeds/Consumer goods stack in inventory
            const existingRes = await client.query(`
                SELECT id FROM inventory 
                WHERE user_id = $1 AND item_id = $2
            `, [userId, itemId]);

            if (existingRes.rows.length > 0) {
                await client.query(`
                    UPDATE inventory SET quantity = quantity + $1 
                    WHERE id = $2
                `, [quantity, existingRes.rows[0].id]);
            } else {
                await client.query(`
                    INSERT INTO inventory (user_id, item_id, quantity)
                    VALUES ($1, $2, $3)
                `, [userId, itemId, quantity]);
            }

            // 5. NEW: Also add seeds to silo_inventory (inline to avoid nested transactions)
            if (item.type === 'seed') {
                const siloRes = await client.query(
                    'SELECT silo_inventory FROM users WHERE id = $1',
                    [userId]
                );

                const silo = siloRes.rows[0]?.silo_inventory || { seeds: {}, produce: {} };

                if (!silo.seeds) {
                    silo.seeds = {};
                }

                const currentQty = silo.seeds[itemId] || 0;
                silo.seeds[itemId] = currentQty + quantity;

                await client.query(
                    'UPDATE users SET silo_inventory = $1 WHERE id = $2',
                    [JSON.stringify(silo), userId]
                );
            }
        }

        return { success: true, newBalance: parseFloat(user.money) - totalCost };
    });
}

export async function equipImplement(userId: number, tractorInvId: number, implementInvId: number) {
    return await transaction(async (client) => {
        // 1. Fetch Tractor
        const tractorRes = await client.query(`
            SELECT i.instance_id, g.stats 
            FROM inventory i
            JOIN game_items g ON i.item_id = g.id
            WHERE i.id = $1 AND i.user_id = $2 AND g.type = 'tractor'
        `, [tractorInvId, userId]);

        if (tractorRes.rows.length === 0) throw new Error('Tractor not found');
        const tractor = tractorRes.rows[0];

        // 2. Fetch Implement
        const impRes = await client.query(`
            SELECT i.instance_id, i.attached_to, g.stats 
            FROM inventory i
            JOIN game_items g ON i.item_id = g.id
            WHERE i.id = $1 AND i.user_id = $2 AND g.type = 'implement'
        `, [implementInvId, userId]);

        if (impRes.rows.length === 0) throw new Error('Implement not found');
        const implement = impRes.rows[0];

        // 3. Validations
        if (implement.attached_to) throw new Error('Implemento já está em uso');

        const tractorHp = tractor.stats.hp || 0;
        const reqHp = implement.stats.req_hp || 0;

        if (tractorHp < reqHp) {
            throw new Error(`Potência insuficiente! Precisa de ${reqHp}cv, trator tem ${tractorHp}cv.`);
        }

        // 4. Attach (save tractor instance_id in implement)
        await client.query(`
            UPDATE inventory SET attached_to = $1 WHERE id = $2
        `, [tractor.instance_id, implementInvId]);

        return { success: true };
    });
}

export async function unequipImplement(userId: number, implementInvId: number) {
    return await query(`
        UPDATE inventory SET attached_to = NULL 
        WHERE id = $1 AND user_id = $2
     `, [implementInvId, userId]);
}
