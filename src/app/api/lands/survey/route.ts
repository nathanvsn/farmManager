import { NextResponse } from 'next/server';
import { generateLandForBounds } from '@/lib/landGenerator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bounds } = body; // { south, west, north, east }

        if (!bounds) {
            return NextResponse.json({ error: 'Missing bounds' }, { status: 400 });
        }

        const result = await generateLandForBounds(bounds);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error surveying lands:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
