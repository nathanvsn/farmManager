
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSiloInventory } from '@/lib/siloService';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.id as number;
        const silo = await getSiloInventory(userId);

        // Calculate statistics
        const totalSeeds = silo.seeds.reduce((sum, s) => sum + s.quantity, 0);
        const totalProduce = silo.produce.reduce((sum, p) => sum + p.quantity, 0);

        return NextResponse.json({
            seeds: silo.seeds,
            produce: silo.produce,
            statistics: {
                total_seeds_kg: totalSeeds,
                total_produce_kg: totalProduce,
                seed_types: silo.seeds.length,
                produce_types: silo.produce.length
            }
        });
    } catch (error: any) {
        console.error('Silo fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
