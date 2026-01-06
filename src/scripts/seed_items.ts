import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'farming_manager',
});

const ITEMS = [
    // =====================
    //      TRACTORS
    // =====================
    {
        name: 'Haverston FieldTrekker 10',
        type: 'tractor',
        category: 'compact',
        price: 20000,
        description: 'Trator compacto ideal para pequenas propriedades.',
        image_url: '/assets/items/tractors/tractor_01_haverston_ft10_1767741486026.png',
        stats: { hp: 5, speed_multiplier: 0.8 }
    },
    {
        name: 'Haverston FieldStar 75',
        type: 'tractor',
        category: 'small',
        price: 27500,
        description: 'Trator pequeno versátil com carregador frontal.',
        image_url: '/assets/items/tractors/tractor_02_haverston_fs75_1767741500354.png',
        stats: { hp: 8, speed_multiplier: 0.9 }
    },
    {
        name: 'Haverston FieldTrekker 25',
        type: 'tractor',
        category: 'small',
        price: 31500,
        description: 'Trator confiável para tarefas do dia a dia.',
        image_url: '/assets/items/tractors/tractor_03_haverston_ft25_1767741515401.png',
        stats: { hp: 10, speed_multiplier: 1.0 }
    },
    {
        name: 'Haverston FieldTrekker 50',
        type: 'tractor',
        category: 'small',
        price: 45000,
        description: 'Trator robusto para médias propriedades.',
        image_url: '/assets/items/tractors/tractor_04_haverston_ft50_1767741529077.png',
        stats: { hp: 10, speed_multiplier: 1.1 }
    },
    {
        name: 'Agritech Farmline 70',
        type: 'tractor',
        category: 'medium',
        price: 58000,
        description: 'Trator médio com ótima relação custo-benefício.',
        image_url: '/assets/items/tractors/tractor_05_agritech_fl70_1767741543132.png',
        stats: { hp: 15, speed_multiplier: 1.2 }
    },
    {
        name: 'Agritech Farmline 80',
        type: 'tractor',
        category: 'medium',
        price: 85000,
        description: 'Trator versátil para diversas operações agrícolas.',
        image_url: '/assets/items/tractors/tractor_06_agritech_fl80_1767741556804.png',
        stats: { hp: 20, speed_multiplier: 1.3 }
    },
    {
        name: 'Agritech Farmline 90',
        type: 'tractor',
        category: 'medium',
        price: 100000,
        description: 'Trator potente para operações pesadas.',
        image_url: '/assets/items/tractors/tractor_07_agritech_fl90_1767741587247.png',
        stats: { hp: 25, speed_multiplier: 1.4 }
    },
    {
        name: 'Klaals ProField 120',
        type: 'tractor',
        category: 'large',
        price: 135000,
        description: 'Trator de alta performance para grandes áreas.',
        image_url: '/assets/items/tractors/tractor_08_klaals_pf120_1767741600980.png',
        stats: { hp: 30, speed_multiplier: 1.5 }
    },
    {
        name: 'Fenridge Trekker 250',
        type: 'tractor',
        category: 'large',
        price: 145000,
        description: 'Trator premium com tecnologia avançada.',
        image_url: '/assets/items/tractors/tractor_09_fenridge_t250_1767741615513.png',
        stats: { hp: 35, speed_multiplier: 1.6 }
    },
    {
        name: 'Haverston FieldTrekker 100',
        type: 'tractor',
        category: 'large',
        price: 165000,
        description: 'Trator grande e confiável para fazendas extensas.',
        image_url: '/assets/items/tractors/tractor_10_haverston_ft100_1767741629851.png',
        stats: { hp: 40, speed_multiplier: 1.7 }
    },
    {
        name: 'New Halland 66P100',
        type: 'tractor',
        category: 'large',
        price: 220000,
        description: 'Trator profissional com cabine de luxo.',
        image_url: '/assets/items/tractors/tractor_11_newhalland_66p100_1767741647430.png',
        stats: { hp: 50, speed_multiplier: 1.8 }
    },
    {
        name: 'New Halland 66P200',
        type: 'tractor',
        category: 'large',
        price: 350000,
        description: 'Trator pesado para operações intensivas.',
        image_url: '/assets/items/tractors/tractor_12_newhalland_66p200_1767741662297.png',
        stats: { hp: 65, speed_multiplier: 2.0 }
    },
    {
        name: 'Fourd 4000',
        type: 'tractor',
        category: 'large',
        price: 420000,
        description: 'Trator ultra-potente para grandes plantações.',
        image_url: '/assets/items/tractors/tractor_13_fourd_4000_1767741696018.png',
        stats: { hp: 75, speed_multiplier: 2.2 }
    },
    {
        name: 'New Halland 66P600',
        type: 'tractor',
        category: 'large',
        price: 600000,
        description: 'Trator premium de alta potência.',
        image_url: '/assets/items/tractors/tractor_14_newhalland_66p600_1767741711463.png',
        stats: { hp: 120, speed_multiplier: 2.5 }
    },
    {
        name: 'Kuboto KuboMax 100',
        type: 'tractor',
        category: 'super_heavy',
        price: 4200000,
        description: 'Trator industrial para operações em larga escala.',
        image_url: '/assets/items/tractors/tractor_15_kuboto_kubomax100_1767741734862.png',
        stats: { hp: 220, speed_multiplier: 3.0 }
    },
    {
        name: 'Lamborghana LambroTrac 420',
        type: 'tractor',
        category: 'luxury',
        price: 115000000,
        description: 'Trator de luxo com design exclusivo.',
        image_url: 'https://placehold.co/400x300/ff6600/white?text=Lamborghana+420hp',
        stats: { hp: 420, speed_multiplier: 4.0 }
    },
    {
        name: 'Lamborghana LambroTrac 620',
        type: 'tractor',
        category: 'luxury',
        price: 215000000,
        description: 'O trator definitivo. Performance e luxo absolutos.',
        image_url: 'https://placehold.co/400x300/ff6600/white?text=Lamborghana+620hp',
        stats: { hp: 620, speed_multiplier: 5.0 }
    },

    // =====================
    //   SEMEADEIRAS
    // =====================
    {
        name: 'Broadcast Seeder x10',
        type: 'implement',
        category: 'seeder',
        price: 10500,
        description: 'Semeadeira a lanço básica para áreas pequenas.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 5, efficiency: 5, operation: 'sowing' }
    },
    {
        name: 'Broadcast Seeder x20',
        type: 'implement',
        category: 'seeder',
        price: 18450,
        description: 'Semeadeira a lanço intermediária.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 8, efficiency: 11, operation: 'sowing' }
    },
    {
        name: 'Broadcast Seeder x30',
        type: 'implement',
        category: 'seeder',
        price: 26400,
        description: 'Semeadeira a lanço de alta capacidade.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 14, efficiency: 15, operation: 'sowing' }
    },
    {
        name: 'Drill Seeder D10',
        type: 'implement',
        category: 'seeder',
        price: 28000,
        description: 'Semeadeira de precisão para plantio em linha.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 30, efficiency: 19, operation: 'sowing' }
    },
    {
        name: 'Drill Seeder D20',
        type: 'implement',
        category: 'seeder',
        price: 34000,
        description: 'Semeadeira de precisão dupla.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 60, efficiency: 38, operation: 'sowing' }
    },
    {
        name: 'AirSeeder A15-C',
        type: 'implement',
        category: 'seeder',
        price: 80000,
        description: 'Semeadeira pneumática de alta eficiência.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 140, efficiency: 30, operation: 'sowing' }
    },
    {
        name: 'Drill Seeder D50',
        type: 'implement',
        category: 'seeder',
        price: 116000,
        description: 'Semeadeira profissional para grandes áreas.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 175, efficiency: 40, operation: 'sowing' }
    },
    {
        name: 'No-Till Seeder F120',
        type: 'implement',
        category: 'seeder',
        price: 200000,
        description: 'Semeadeira para plantio direto, preserva o solo.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 300, efficiency: 60, operation: 'sowing' }
    },
    {
        name: 'Drill Seeder D100',
        type: 'implement',
        category: 'seeder',
        price: 300000,
        description: 'Semeadeira premium de alta produtividade.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 500, efficiency: 80, operation: 'sowing' }
    },
    {
        name: 'No-Till Seeder F500',
        type: 'implement',
        category: 'seeder',
        price: 400000,
        description: 'A melhor semeadeira do mercado.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 550, efficiency: 90, operation: 'sowing' }
    },

    // =====================
    //      ARADOS
    // =====================
    {
        name: '2 Bottom Disc Plow',
        type: 'implement',
        category: 'plow',
        price: 19000,
        description: 'Arado de discos básico para pequenas áreas.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 5, efficiency: 8, operation: 'plowing' }
    },
    {
        name: '3 Bottom Disc Plow',
        type: 'implement',
        category: 'plow',
        price: 20000,
        description: 'Arado de discos intermediário.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 14, efficiency: 10, operation: 'plowing' }
    },
    {
        name: '3 Bottom Moldboard Plow',
        type: 'implement',
        category: 'plow',
        price: 34000,
        description: 'Arado de aiveca para revolvimento profundo.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 140, efficiency: 14, operation: 'plowing' }
    },
    {
        name: '4 Bottom Disc Plow',
        type: 'implement',
        category: 'plow',
        price: 50000,
        description: 'Arado de discos de alta capacidade.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 8, efficiency: 20, operation: 'plowing' }
    },
    {
        name: '9 Shank Chisel Plow',
        type: 'implement',
        category: 'plow',
        price: 70000,
        description: 'Escarificador para preparo sem inversão total.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 150, efficiency: 27, operation: 'plowing' }
    },
    {
        name: '11 Bottom Moldboard Plow',
        type: 'implement',
        category: 'plow',
        price: 132000,
        description: 'Arado de aiveca premium para grandes áreas.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 60, efficiency: 51, operation: 'plowing' }
    },
    {
        name: '11 Shank Chisel Plow',
        type: 'implement',
        category: 'plow',
        price: 135000,
        description: 'Escarificador de alta performance.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 50, efficiency: 51, operation: 'plowing' }
    },
    {
        name: '11 Bottom Moldboard Plow Pro',
        type: 'implement',
        category: 'plow',
        price: 165000,
        description: 'Arado profissional de alta durabilidade.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 50, efficiency: 51, operation: 'plowing' }
    },
    {
        name: 'Harrow Plow',
        type: 'implement',
        category: 'plow',
        price: 184000,
        description: 'Grade niveladora para acabamento perfeito.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 420, efficiency: 70, operation: 'plowing' }
    },
    {
        name: 'Rotary Plow XP-1000G',
        type: 'implement',
        category: 'plow',
        price: 250000,
        description: 'Enxada rotativa de última geração.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { req_hp: 550, efficiency: 100, operation: 'plowing' }
    },

    // =====================
    //      LIMPEZA
    // =====================
    {
        name: 'Roçadeira Hidráulica',
        type: 'implement',
        category: 'cleaner',
        price: 25000,
        description: 'Para limpar terrenos com vegetação leve.',
        image_url: '/assets/items/implements/implement_broadcast_seeder_1767740940174.png',
        stats: { req_hp: 50, efficiency: 0.8, operation: 'cleaning' }
    },
    {
        name: 'Escavadeira Florestal',
        type: 'heavy',
        category: 'deforester',
        price: 600000,
        description: 'Remove árvores e limpa terreno bruto rapidamente.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { hp: 200, efficiency: 1.5, speed_multiplier: 1.0, operation: 'cleaning' }
    },

    // =====================
    //     COLHEITADEIRAS
    // =====================
    {
        name: 'Colheitadeira S400',
        type: 'heavy',
        category: 'harvester',
        price: 900000,
        description: 'Colheitadeira de entrada para médias produções.',
        image_url: '/assets/items/implements/implement_drill_seeder_1767740953506.png',
        stats: { hp: 300, efficiency: 2.0, speed_multiplier: 1.0, operation: 'harvesting' }
    },

    // =====================
    //       SEMENTES
    // =====================
    {
        name: 'Semente de Soja',
        type: 'seed',
        category: 'soybean',
        price: 5,
        description: 'Ciclo rápido e boa valorização no mercado.',
        image_url: '/assets/items/seeds/soybean.png',
        stats: { growth_time: 120, yield_kg_ha: 3500, seed_usage_kg_ha: 60, sell_price: 3.5 }
    },
    {
        name: 'Semente de Milho',
        type: 'seed',
        category: 'corn',
        price: 3,
        description: 'Alta produtividade por hectare.',
        image_url: '/assets/items/seeds/corn.png',
        stats: { growth_time: 180, yield_kg_ha: 9000, seed_usage_kg_ha: 20, sell_price: 1.2 }
    },

    // =====================
    //       PRODUÇÃO
    // =====================
    {
        name: 'Soja',
        type: 'produce',
        category: 'soybean',
        price: 0,
        description: 'Soja colhida, pronta para venda no mercado.',
        image_url: '/assets/items/seeds/soybean.png',
        stats: { sell_price: 3.5 }
    },
    {
        name: 'Milho',
        type: 'produce',
        category: 'corn',
        price: 0,
        description: 'Milho colhido, pronto para venda no mercado.',
        image_url: '/assets/items/seeds/corn.png',
        stats: { sell_price: 1.2 }
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
