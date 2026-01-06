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

        if (!landId) {
            return NextResponse.json({ error: 'Missing landId' }, { status: 400 });
        }

        const result = await buyLand(session.id, landId);
        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 500 });
    }
}
