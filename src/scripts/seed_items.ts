
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

const ITEMS = [
    // --- TRACTORS ---
    {
        name: 'Trator Leve 75cv',
        type: 'tractor',
        category: 'small',
        price: 150000,
        description: 'Ideal para pequenas propriedades e tarefas leves.',
        image_url: 'https://placehold.co/200x150?text=Trator+75cv',
        stats: { hp: 75, speed_multiplier: 1.0 }
    },
    {
        name: 'Trator Médio 150cv',
        type: 'tractor',
        category: 'medium',
        price: 350000,
        description: 'Versátil e potente para a maioria dos implementos.',
        image_url: 'https://placehold.co/200x150?text=Trator+150cv',
        stats: { hp: 150, speed_multiplier: 1.5 }
    },
    {
        name: 'Trator Pesado 370cv',
        type: 'tractor',
        category: 'large',
        price: 1200000,
        description: 'Monstro do campo para grandes áreas.',
        image_url: 'https://placehold.co/200x150?text=Trator+370cv',
        stats: { hp: 370, speed_multiplier: 2.5 }
    },

    // --- IMPLEMENTS ---
    {
        name: 'Arado de Discos',
        type: 'implement',
        category: 'plow',
        price: 45000,
        description: 'Para preparar o solo bruto ou arar terra limpa.',
        image_url: 'https://placehold.co/200x150?text=Arado',
        stats: { req_hp: 70, efficiency: 1.0, operation: 'plowing' }
        // efficiency = hectares/hour base (modified by tractor speed)
    },
    {
        name: 'Grade Aradora Pesada',
        type: 'implement',
        category: 'plow',
        price: 120000,
        description: 'Maior largura de trabalho.',
        image_url: 'https://placehold.co/200x150?text=Grade+Pesada',
        stats: { req_hp: 200, efficiency: 2.5, operation: 'plowing' }
    },
    {
        name: 'Semeadeira de Precisão',
        type: 'implement',
        category: 'seeder',
        price: 85000,
        description: 'Para o plantio de grãos.',
        image_url: 'https://placehold.co/200x150?text=Semeadeira',
        stats: { req_hp: 90, efficiency: 1.5, operation: 'sowing' }
    },
    {
        name: 'Semeadeira Large-Scale',
        type: 'implement',
        category: 'seeder',
        price: 450000,
        description: 'Alta capacidade para grandes áreas.',
        image_url: 'https://placehold.co/200x150?text=Semeadeira+LS',
        stats: { req_hp: 300, efficiency: 4.0, operation: 'sowing' }
    },
    {
        name: 'Roçadeira Hidráulica',
        type: 'implement',
        category: 'cleaner',
        price: 25000,
        description: 'Para limpar terrenos brutos.',
        image_url: 'https://placehold.co/200x150?text=Rocadeira',
        stats: { req_hp: 50, efficiency: 0.8, operation: 'cleaning' }
    },

    // --- HEAVY MACHINERY ---
    {
        name: 'Colheitadeira S400',
        type: 'heavy',
        category: 'harvester',
        price: 900000,
        description: 'Colheitadeira de entrada.',
        image_url: 'https://placehold.co/200x150?text=Colheitadeira',
        stats: { hp: 300, efficiency: 2.0, speed_multiplier: 1.0, operation: 'harvesting' }
    },
    {
        name: 'Escavadeira Florestal',
        type: 'heavy',
        category: 'deforester',
        price: 600000,
        description: 'Remove árvores e limpa terreno bruto rapidamente.',
        image_url: 'https://placehold.co/200x150?text=Escavadeira',
        stats: { hp: 200, efficiency: 1.5, speed_multiplier: 1.0, operation: 'cleaning' }
    },

    // --- SEEDS ---
    // growth_time in seconds for demo purposes (usually would be hours/days)
    {
        name: 'Semente de Soja',
        type: 'seed',
        category: 'soybean',
        price: 5, // Price per kg
        description: 'Ciclo rápido e boa valorização.',
        image_url: 'https://placehold.co/200x150?text=Soja',
        stats: { growth_time: 120, yield_kg_ha: 3500, seed_usage_kg_ha: 60, sell_price: 3.5 }
    },
    {
        name: 'Semente de Milho',
        type: 'seed',
        category: 'corn',
        price: 3,
        description: 'Alta produtividade por hectare.',
        image_url: 'https://placehold.co/200x150?text=Milho',
        stats: { growth_time: 180, yield_kg_ha: 9000, seed_usage_kg_ha: 20, sell_price: 1.2 }
    },

    // --- PRODUCE (Harvested crops) ---
    {
        name: 'Soja',
        type: 'produce',
        category: 'soybean',
        price: 0, // Not sold in shop, only harvested
        description: 'Soja colhida, pronta para venda.',
        image_url: 'https://placehold.co/200x150?text=Soja+Colhida',
        stats: { sell_price: 3.5 } // Same as seed sell_price for market
    },
    {
        name: 'Milho',
        type: 'produce',
        category: 'corn',
        price: 0, // Not sold in shop, only harvested
        description: 'Milho colhido, pronto para venda.',
        image_url: 'https://placehold.co/200x150?text=Milho+Colhido',
        stats: { sell_price: 1.2 } // Same as seed sell_price for market
    }
];

async function seedItems() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Seeding items...');
        await client.query('BEGIN');

        // Clear existing to avoid duplicates in dev
        await client.query('TRUNCATE game_items CASCADE');

        for (const item of ITEMS) {
            await client.query(`
                INSERT INTO game_items (name, type, category, price, description, image_url, stats)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [item.name, item.type, item.category, item.price, item.description, item.image_url, JSON.stringify(item.stats)]);
        }

        await client.query('COMMIT');
        console.log(`Seeded ${ITEMS.length} items successfully.`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

seedItems();
