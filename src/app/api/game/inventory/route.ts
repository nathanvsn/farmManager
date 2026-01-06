
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getInventory, equipImplement, unequipImplement } from '@/lib/inventoryService';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const inventory = await getInventory(session.id);
        return NextResponse.json({ inventory });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action, tractorId, implementId, implementInvId } = body;

        if (action === 'equip') {
            await equipImplement(session.id, tractorId, implementId);
            return NextResponse.json({ success: true });
        } else if (action === 'unequip') {
            await unequipImplement(session.id, implementInvId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
