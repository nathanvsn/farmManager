import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox'); // minLon,minLat,maxLon,maxLat

    if (!bbox) {
        return NextResponse.json({ error: 'Missing bbox parameter' }, { status: 400 });
    }

    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);

    try {
        // Select lands intersecting the bbox
        // Convert geom to GeoJSON
        const res = await query(`
      SELECT 
        id, 
        owner_id, 
        area_sqm, 
        land_type,
        price,
        condition,
        status,
        ST_AsGeoJSON(geom)::json as geometry 
      FROM lands 
      WHERE ST_Intersects(
        geom, 
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      LIMIT 500;
    `, [minLon, minLat, maxLon, maxLat]);

        const features = res.rows.map(row => ({
            type: 'Feature',
            properties: {
                id: row.id,
                owner_id: row.owner_id,
                area_sqm: row.area_sqm,
                land_type: row.land_type,
                price: row.price,
                condition: row.condition,
                status: row.status
            },
            geometry: row.geometry
        }));

        return NextResponse.json({
            type: 'FeatureCollection',
            features
        });

    } catch (error) {
        console.error('Error fetching lands:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
