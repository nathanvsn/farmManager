
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getMarketPrices, sellProduce } from '@/lib/marketService';
import { getSiloInventory } from '@/lib/siloService';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.id as number;

        // Get market prices
        const prices = await getMarketPrices();

        // Get user's silo to show available quantities
        const silo = await getSiloInventory(userId);

        // Merge prices with user's available produce
        const enrichedPrices = prices.map(price => {
            const userProduce = silo.produce.find(p => p.id === price.item_id);
            return {
                ...price,
                available_quantity: userProduce?.quantity || 0
            };
        });

        return NextResponse.json({ prices: enrichedPrices });
    } catch (error: any) {
        console.error('Market fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { itemId, quantity } = body;

        if (!itemId || !quantity || quantity <= 0) {
            return NextResponse.json(
                { error: 'itemId e quantity são obrigatórios' },
                { status: 400 }
            );
        }

        const userId = session.id as number;
        const result = await sellProduce(userId, itemId, quantity);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Sell error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
