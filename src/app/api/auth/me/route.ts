import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.id as number;
    if (typeof userId !== 'number') {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch fresh data
    const result = await query('SELECT id, nickname, email, money, diamonds FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        user: {
            ...user,
            money: parseFloat(user.money)
        }
    });
}
