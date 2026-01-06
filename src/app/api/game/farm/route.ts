
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { startAction, finishOperation } from '@/lib/farmingService';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action, landId, toolInvId, type } = body;

        const userId = session.id as number;
        if (typeof userId !== 'number') {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // action: 'start' | 'finish'

        if (type === 'finish') {
            const result = await finishOperation(userId, landId);
            return NextResponse.json(result);
        } else if (type === 'start') {
            if (!toolInvId) return NextResponse.json({ error: 'Tool required' }, { status: 400 });
            const result = await startAction(userId, landId, action, toolInvId);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
