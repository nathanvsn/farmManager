import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nickname, email, password } = body;

        if (!nickname || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE email = $1 OR nickname = $2', [email, nickname]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Create user
        const result = await query(`
            INSERT INTO users (nickname, email, password_hash, money, diamonds)
            VALUES ($1, $2, $3, 200000, 200)
            RETURNING id, nickname, email, money, diamonds
        `, [nickname, email, hashedPassword]);

        const user = result.rows[0];
        const token = await signToken({ id: user.id, email: user.email, nickname: user.nickname });

        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
