import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { repairEquipment } from '@/lib/inventoryService';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const { inventoryId } = body;

        if (!inventoryId) {
            return NextResponse.json({ error: 'ID do equipamento é obrigatório' }, { status: 400 });
        }

        const result = await repairEquipment(session.id as number, inventoryId);

        // Dispatch event for UI update
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Repair error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
