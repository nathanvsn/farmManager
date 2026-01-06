
import { query, transaction } from '@/lib/db';

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

export async function startAction(userId: number, landId: string | number, action: 'clean' | 'plow' | 'sow' | 'harvest', toolInvId: number) {
    return await transaction(async (client) => {
        // 1. Get Land
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        if (landRes.rows.length === 0) throw new Error('Land not found');
        const land = landRes.rows[0];

        if (land.owner_id !== userId) throw new Error('Não é dono desta terra');
        if (land.operation_end && new Date(land.operation_end) > new Date()) throw new Error('Terra em uso/operação');

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
        }

        const durationSeconds = getGameDuration(land.area_sqm, efficiency);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

        // Update Land
        await client.query(`
            UPDATE lands 
            SET operation_start = $1, operation_end = $2, operation_type = $3
            WHERE id = $4
        `, [startTime, endTime, action, landId]);

        return { success: true, duration: durationSeconds, endTime };
    });
}

// Call this when timer ends to finalize state
export async function finishOperation(userId: number, landId: string | number) {
    return await transaction(async (client) => {
        const landRes = await client.query('SELECT * FROM lands WHERE id = $1 FOR UPDATE', [landId]);
        const land = landRes.rows[0];

        if (!land.operation_end || new Date() < new Date(land.operation_end)) {
            // throw new Error('Operação ainda não terminou');
            // Or just return false
            return { completed: false };
        }

        const action = land.operation_type;
        let newCondition = land.condition;
        let cropId = land.current_crop_id;

        if (action === 'clean') newCondition = 'limpo';
        if (action === 'plow') newCondition = 'arado';
        if (action === 'sow') {
            newCondition = 'growing';
            // Logic to set crop would be passed in startAction, fixed later
        }

        // Clear operation
        await client.query(`
            UPDATE lands 
            SET condition = $1, operation_start = NULL, operation_end = NULL, operation_type = NULL 
            WHERE id = $2
        `, [newCondition, landId]);

        return { completed: true, newCondition };
    });
}
