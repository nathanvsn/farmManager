
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buyItem } from '@/lib/inventoryService';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        let sql = 'SELECT * FROM game_items';
        const params: any[] = [];

        if (category) {
            sql += ' WHERE type = $1 OR category = $1';
            params.push(category);
        }

        sql += ' ORDER BY price ASC';

        const res = await query(sql, params);
        return NextResponse.json({ items: res.rows });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { itemId, quantity } = body;

        const result = await buyItem(session.id, itemId, quantity || 1);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
