
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkMaturation } from '@/lib/farmingService';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await checkMaturation();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Maturation check error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
