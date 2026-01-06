
import { query, transaction } from '@/lib/db';
import { removeFromSilo, addToSilo } from '@/lib/siloService';

// Helper to calculate duration in seconds
function calculateDuration(areaSqm: number, efficiencyHaH: number, speedMultiplier: number) {
    const areaHa = areaSqm / 10000;
    const haPerHour = efficiencyHaH * speedMultiplier;
    const hours = areaHa / haPerHour;
    return Math.ceil(hours * 60 * 60); // Seconds (realistically too long for a game, maybe speed up time here?)
    // For Gameplay Speed: Let's apply a "Game Time Factor" of 60x (1 minute real = 1 hour game)
    // So duration in real seconds = hours * 60
    // return Math.ceil(hours * 60); 
}

// Just returning seconds for now, can perform speed logic in frontend or here later.
// Let's stick effectively to: 1 Ha with 1 Ha/h takes 10 seconds for demo smoothness
function getGameDuration(areaSqm: number, efficiency: number) {
    const areaHa = areaSqm / 10000;
    // Base: 10 seconds per Hectare per Efficiency Unit
    const baseSecondsPerHa = 30;
    return Math.floor((areaHa * baseSecondsPerHa) / (efficiency || 1));
}

export async function startAction(userId: number, landId: string | number, action: 'clean' | 'plow' | 'sow' | 'harvest', toolInvId: number, seedId?: number) {
    return await transaction(async (client) => {
        // 1. Get Land
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        if (landRes.rows.length === 0) throw new Error('Land not found');
        const land = landRes.rows[0];

        if (Number(land.owner_id) !== Number(userId)) {
            console.log(`Ownership Mismatch: LandOwner=${land.owner_id} (${typeof land.owner_id}) vs User=${userId} (${typeof userId})`);
            throw new Error('Não é dono desta terra');
        }

        // Check if there's an operation in progress
        if (land.operation_end && new Date(land.operation_end) > new Date()) {
            const operationName = land.operation_type === 'clean' ? 'Limpeza' :
                land.operation_type === 'plow' ? 'Aragem' :
                    land.operation_type === 'sow' ? 'Plantio' : 'Operação';
            const minutesRemaining = Math.ceil((new Date(land.operation_end).getTime() - Date.now()) / 60000);
            throw new Error(`${operationName} em andamento! Faltam ~${minutesRemaining} minuto(s).`);
        }

        // 2. Validate Action vs State
        // Rules:
        // Clean: Needs 'bruto'
        // Plow: Needs 'limpo' (or bruto if heavy plow)
        // Sow: Needs 'arado'
        // Harvest: Needs 'growing' (handled separately usually)

        if (action === 'clean' && land.condition !== 'bruto') throw new Error('Esta terra não precisa de limpeza');
        if (action === 'plow' && !['limpo', 'bruto'].includes(land.condition)) throw new Error('Condição inválida para arar');
        if (action === 'sow' && land.condition !== 'arado') throw new Error('Precisa arar antes de semear');

        // 3. Get Tool & Stats
        // We expect toolInvId to be the *Tractor* (inventory.id) that has an implement attached, OR a Heavy Machine
        // Or simplified: user selects the "Fleet Set" (Tractor+Implement). 
        // Let's assume toolInvId is the INVENTORY ID of the MAIN MACHINE (Tractor or Heavy)

        const machineRes = await client.query(`
            SELECT i.id, i.instance_id, g.stats, g.type, 
                   imp.stats as imp_stats, imp_g.category as imp_category
            FROM inventory i
            JOIN game_items g ON i.item_id = g.id
            LEFT JOIN inventory imp_i ON imp_i.attached_to = i.instance_id
            LEFT JOIN game_items imp_g ON imp_i.item_id = imp_g.id
            LEFT JOIN game_items as imp ON imp_i.item_id = imp.id
            WHERE i.id = $1 AND i.user_id = $2
        `, [toolInvId, userId]);

        if (machineRes.rows.length === 0) throw new Error('Máquina não encontrada');
        const machine = machineRes.rows[0];

        let efficiency = 0;
        let operationType = '';

        // Logic check
        if (action === 'clean') {
            if (machine.type === 'heavy' && machine.stats.operation === 'cleaning') {
                efficiency = machine.stats.efficiency;
            } else if (machine.imp_category === 'cleaner') {
                efficiency = machine.imp_stats.efficiency * (machine.stats.speed_multiplier || 1);
            } else {
                throw new Error('Equipamento incorreto para limpar');
            }
        } else if (action === 'plow') {
            if (machine.imp_category === 'plow') {
                efficiency = machine.imp_stats.efficiency * (machine.stats.speed_multiplier || 1);
            } else {
                throw new Error('Precisa de um arado acoplado');
            }
        } else if (action === 'sow') {
            if (machine.imp_category === 'seeder') {
                efficiency = machine.imp_stats.efficiency * (machine.stats.speed_multiplier || 1);
            } else {
                throw new Error('Precisa de uma semeadeira acoplada');
            }

            // Seed deduction logic
            if (!seedId) {
                throw new Error('Selecione uma semente para plantar');
            }

            // Get seed info
            const seedRes = await client.query(
                'SELECT * FROM game_items WHERE id = $1 AND type = $2',
                [seedId, 'seed']
            );

            if (seedRes.rows.length === 0) {
                throw new Error('Semente não encontrada');
            }

            const seed = seedRes.rows[0];
            const areaHa = land.area_sqm / 10000;
            const requiredSeeds = Math.ceil(areaHa * (seed.stats.seed_usage_kg_ha || 60));

            // Check and deduct seeds from silo using siloService
            try {
                await removeFromSilo(userId, 'seeds', seedId, requiredSeeds);
            } catch (error: any) {
                throw new Error(`Sementes insuficientes. ${error.message}`);
            }
        }

        const durationSeconds = getGameDuration(land.area_sqm, efficiency);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

        // Update Land (add current_crop_id for sow)
        if (action === 'sow' && seedId) {
            await client.query(`
                UPDATE lands 
                SET operation_start = $1, operation_end = $2, operation_type = $3, current_crop_id = $4
                WHERE id = $5
            `, [startTime, endTime, action, seedId, landId]);
        } else {
            await client.query(`
                UPDATE lands 
                SET operation_start = $1, operation_end = $2, operation_type = $3
                WHERE id = $4
            `, [startTime, endTime, action, landId]);
        }

        return { success: true, duration: durationSeconds, endTime };
    });
}

// Call this when timer ends to finalize state
export async function finishOperation(userId: number, landId: string | number) {
    return await transaction(async (client) => {
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        const land = landRes.rows[0];

        if (!land.operation_end || new Date() < new Date(land.operation_end)) {
            return { completed: false };
        }

        const action = land.operation_type;

        // If harvest, redirect to finishHarvest
        if (action === 'harvest') {
            // Re-use finishHarvest logic (need to exit transaction and call it)
            // Actually, we can't easily call another transaction from within this one
            // So we'll handle harvest completion here inline
            return await finishHarvestInline(client, userId, landId, land);
        }

        let newCondition = land.condition;
        let cropId = land.current_crop_id;

        if (action === 'clean') newCondition = 'limpo';
        if (action === 'plow') newCondition = 'arado';
        if (action === 'sow') {
            newCondition = 'growing';
            // Get seed growth time and set new operation_end for maturation
            const seedRes = await client.query(
                'SELECT stats FROM game_items WHERE id = $1',
                [cropId]
            );

            if (seedRes.rows.length > 0) {
                const seed = seedRes.rows[0];
                const growthTime = seed.stats.growth_time || 120; // seconds
                const maturationTime = new Date(Date.now() + growthTime * 1000);

                await client.query(`
                    UPDATE lands 
                    SET condition = $1, operation_start = NOW(), operation_end = $2, operation_type = 'growing'
                    WHERE id = $3
                `, [newCondition, maturationTime, landId]);

                return { completed: true, newCondition, maturationTime };
            }
        }

        // Clear operation for other actions
        await client.query(`
            UPDATE lands 
            SET condition = $1, operation_start = NULL, operation_end = NULL, operation_type = NULL 
            WHERE id = $2
        `, [newCondition, landId]);

        return { completed: true, newCondition };
    });
}

// Helper function to finish harvest within existing transaction
async function finishHarvestInline(client: any, userId: number, landId: string | number, land: any) {
    if (!land.current_crop_id) {
        throw new Error('Nenhuma cultura plantada');
    }

    // Get crop information
    const cropRes = await client.query(
        'SELECT * FROM game_items WHERE id = $1',
        [land.current_crop_id]
    );

    if (cropRes.rows.length === 0) {
        throw new Error('Cultura não encontrada');
    }

    const crop = cropRes.rows[0];
    const areaHa = land.area_sqm / 10000;

    // Calculate yield with random factor (80% - 120%)
    const baseYield = areaHa * (crop.stats.yield_kg_ha || 3000);
    const randomFactor = 0.8 + (Math.random() * 0.4);
    const finalYield = Math.floor(baseYield * randomFactor);

    // Get produce item
    const produceRes = await client.query(
        `SELECT id FROM game_items 
         WHERE type = 'produce' 
         AND category = $1`,
        [crop.category]
    );

    let produceItemId = land.current_crop_id;
    if (produceRes.rows.length > 0) {
        produceItemId = produceRes.rows[0].id;
    }

    // Add to silo (inline to avoid nested transaction)
    const siloRes = await client.query(
        'SELECT silo_inventory FROM users WHERE id = $1',
        [userId]
    );

    const silo = siloRes.rows[0]?.silo_inventory || { seeds: {}, produce: {} };
    if (!silo.produce) silo.produce = {};

    const currentQty = silo.produce[produceItemId] || 0;
    silo.produce[produceItemId] = currentQty + finalYield;

    await client.query(
        'UPDATE users SET silo_inventory = $1 WHERE id = $2',
        [JSON.stringify(silo), userId]
    );

    // Reset land
    await client.query(`
        UPDATE lands 
        SET condition = 'limpo', 
            current_crop_id = NULL, 
            operation_start = NULL, 
            operation_end = NULL, 
            operation_type = NULL
        WHERE id = $1
    `, [landId]);

    return {
        completed: true,
        success: true,
        yield: finalYield,
        cropName: crop.name,
        newCondition: 'limpo'
    };
}

// Start Harvest operation (with timer)
export async function startHarvest(userId: number, landId: string | number, toolInvId: number) {
    return await transaction(async (client) => {
        // 1. Get Land
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        if (landRes.rows.length === 0) throw new Error('Land not found');
        const land = landRes.rows[0];

        // 2. Validate ownership
        if (Number(land.owner_id) !== Number(userId)) {
            throw new Error('Não é dono desta terra');
        }

        // 3. Check if there's an operation in progress
        if (land.operation_end && new Date(land.operation_end) > new Date()) {
            throw new Error('Já existe uma operação em andamento');
        }

        // 4. Check condition is 'mature'
        if (land.condition !== 'mature') {
            throw new Error('A colheita ainda não está madura');
        }

        if (!land.current_crop_id) {
            throw new Error('Nenhuma cultura plantada neste terreno');
        }

        // 5. Validate equipment (harvester)
        const machineRes = await client.query(`
            SELECT g.stats, g.type
            FROM inventory i
            JOIN game_items g ON i.item_id = g.id
            WHERE i.id = $1 AND i.user_id = $2
        `, [toolInvId, userId]);

        if (machineRes.rows.length === 0) {
            throw new Error('Máquina não encontrada');
        }

        const machine = machineRes.rows[0];
        if (machine.type !== 'heavy' || machine.stats.operation !== 'harvesting') {
            throw new Error('Precisa de uma colheitadeira para colher');
        }

        // 6. Calculate harvest duration based on efficiency
        const efficiency = machine.stats.efficiency || 2.0; // Ha/h
        const durationSeconds = getGameDuration(land.area_sqm, efficiency);

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

        // 7. Start harvest operation
        await client.query(`
            UPDATE lands 
            SET operation_start = $1, operation_end = $2, operation_type = 'harvest'
            WHERE id = $3
        `, [startTime, endTime, landId]);

        return { success: true, duration: durationSeconds, endTime };
    });
}

// Finish Harvest operation (after timer completes)
export async function finishHarvest(userId: number, landId: string | number) {
    return await transaction(async (client) => {
        // 1. Get Land
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        if (landRes.rows.length === 0) throw new Error('Land not found');
        const land = landRes.rows[0];

        // 2. Validate ownership
        if (Number(land.owner_id) !== Number(userId)) {
            throw new Error('Não é dono desta terra');
        }

        // 3. Validate operation finished
        if (!land.operation_end || new Date(land.operation_end) > new Date()) {
            return { completed: false };
        }

        if (land.operation_type !== 'harvest') {
            throw new Error('Operação ativa não é colheita');
        }

        if (!land.current_crop_id) {
            throw new Error('Nenhuma cultura plantada');
        }

        // 4. Get crop information
        const cropRes = await client.query(
            'SELECT * FROM game_items WHERE id = $1',
            [land.current_crop_id]
        );

        if (cropRes.rows.length === 0) {
            throw new Error('Cultura não encontrada');
        }

        const crop = cropRes.rows[0];
        const areaHa = land.area_sqm / 10000;

        // 5. Calculate yield with random factor (80% - 120%)
        const baseYield = areaHa * (crop.stats.yield_kg_ha || 3000);
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const finalYield = Math.floor(baseYield * randomFactor);

        // 6. Get produce item (query by category matching seed category)
        const produceRes = await client.query(
            `SELECT id FROM game_items 
             WHERE type = 'produce' 
             AND category = $1`,
            [crop.category] // e.g., 'soybean', 'corn'
        );

        let produceItemId = land.current_crop_id; // fallback to seed ID
        if (produceRes.rows.length > 0) {
            produceItemId = produceRes.rows[0].id;
        }

        // 7. Add to silo
        await addToSilo(userId, 'produce', produceItemId, finalYield);

        // 8. Reset land to 'limpo' (ready for next cycle)
        await client.query(`
            UPDATE lands 
            SET condition = 'limpo', 
                current_crop_id = NULL, 
                operation_start = NULL, 
                operation_end = NULL, 
                operation_type = NULL
            WHERE id = $1
        `, [landId]);

        return {
            completed: true,
            success: true,
            yield: finalYield,
            cropName: crop.name,
            newCondition: 'limpo'
        };
    });
}

// Check maturation - updates all lands that have matured
export async function checkMaturation() {
    const result = await query(`
        UPDATE lands 
        SET condition = 'mature', operation_type = NULL
        WHERE operation_end < NOW() AND condition = 'growing'
        RETURNING id
    `);

    return {
        maturedLands: result.rows.map(row => row.id),
        count: result.rows.length
    };
}
