import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buyLand } from '@/lib/gameService';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { landId } = body;

        // Validate landId (should be a string UUID)
        if (!landId || typeof landId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid landId' }, { status: 400 });
        }

        const userId = session.id as number;
        if (typeof userId !== 'number') {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const result = await buyLand(userId, landId);
        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 500 });
    }
}
