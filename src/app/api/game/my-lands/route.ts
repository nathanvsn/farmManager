import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const res = await query(`
            SELECT 
                id,
                land_type,
                condition,
                area_sqm,
                operation_start,
                operation_end,
                operation_type,
                current_crop_id,
                ST_AsGeoJSON(geom) as geojson
            FROM lands
            WHERE owner_id = $1
            ORDER BY 
                CASE 
                    WHEN operation_end IS NOT NULL AND operation_end > NOW() THEN 1
                    WHEN operation_end IS NOT NULL AND operation_end <= NOW() THEN 2
                    ELSE 3
                END,
                operation_end ASC NULLS LAST
        `, [session.id]);

        const lands = res.rows.map(land => ({
            ...land,
            area_ha: (land.area_sqm / 10000).toFixed(2),
            is_active: land.operation_end && new Date(land.operation_end) > new Date(),
            is_finished: land.operation_end && new Date(land.operation_end) <= new Date(),
            time_remaining: land.operation_end ? Math.max(0, Math.floor((new Date(land.operation_end).getTime() - Date.now()) / 1000)) : null
        }));

        return NextResponse.json({ lands });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch lands' }, { status: 500 });
    }
}
