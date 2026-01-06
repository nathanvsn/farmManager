
import { query, transaction } from '@/lib/db';

export async function getMarketPrices() {
    const result = await query(`
        SELECT 
            mp.*,
            gi.name,
            gi.image_url,
            gi.category
        FROM market_prices mp
        JOIN game_items gi ON mp.item_id = gi.id
        ORDER BY gi.name
    `);

    return result.rows;
}

export async function sellProduce(userId: number, itemId: number, quantity: number) {
    return await transaction(async (client) => {
        // 1. Get user's silo inventory
        const userRes = await client.query(
            'SELECT silo_inventory, money FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );

        if (userRes.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        const user = userRes.rows[0];
        const silo = user.silo_inventory || { seeds: {}, produce: {} };
        const currentQty = silo.produce?.[itemId] || 0;

        if (currentQty < quantity) {
            throw new Error(`Quantidade insuficiente no silo. Disponível: ${currentQty}kg`);
        }

        // 2. Get current market price
        const priceRes = await client.query(
            'SELECT current_price FROM market_prices WHERE item_id = $1',
            [itemId]
        );

        if (priceRes.rows.length === 0) {
            throw new Error('Produto não tem preço de mercado');
        }

        const currentPrice = parseFloat(priceRes.rows[0].current_price);
        const totalValue = currentPrice * quantity;

        // 3. Update silo inventory
        silo.produce[itemId] = currentQty - quantity;
        if (silo.produce[itemId] === 0) {
            delete silo.produce[itemId];
        }

        // 4. Add money and update silo
        await client.query(
            'UPDATE users SET money = money + $1, silo_inventory = $2 WHERE id = $3',
            [totalValue, JSON.stringify(silo), userId]
        );

        const newBalance = parseFloat(user.money) + totalValue;

        return {
            success: true,
            totalValue,
            newBalance,
            quantitySold: quantity
        };
    });
}

export async function updatePrices() {
    return await transaction(async (client) => {
        // Get all market prices
        const pricesRes = await client.query('SELECT * FROM market_prices FOR UPDATE');

        for (const price of pricesRes.rows) {
            const basePrice = parseFloat(price.base_price);

            // Random fluctuation between -15% to +15%
            const fluctuation = (Math.random() * 0.3) - 0.15; // -0.15 to +0.15
            let newPrice = basePrice * (1 + fluctuation);

            // Ensure price doesn't go below 50% of base or above 150% of base
            newPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 1.5, newPrice));

            const currentPrice = parseFloat(price.current_price);

            // Determine trend
            let trend = 'stable';
            if (newPrice > currentPrice * 1.05) {
                trend = 'up';
            } else if (newPrice < currentPrice * 0.95) {
                trend = 'down';
            }

            await client.query(
                `UPDATE market_prices 
                SET current_price = $1, trend = $2, last_update = NOW() 
                WHERE id = $3`,
                [newPrice.toFixed(2), trend, price.id]
            );
        }

        return { success: true };
    });
}

// Get price for a specific item
export async function getPrice(itemId: number) {
    const result = await query(
        'SELECT current_price, trend FROM market_prices WHERE item_id = $1',
        [itemId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return {
        price: parseFloat(result.rows[0].current_price),
        trend: result.rows[0].trend
    };
}
