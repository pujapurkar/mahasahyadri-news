import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({
        status: 'ERR',
        message: 'Username and password are required',
      });
    }

    const db = await getDB();
    const result = await db
      .request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM AdminUsers WHERE Username = @username');

    if (result.recordset.length === 0) {
      return NextResponse.json({
        status: 'ERR',
        message: 'Invalid credentials',
      });
    }

    const user = result.recordset[0];
    
    // Plain password comparison
    if (password !== user.PasswordHash) {
      return NextResponse.json({
        status: 'ERR',
        message: 'Invalid credentials',
      });
    }

    // Create JWT token
    const token = signToken({ userId: user.UserId, username: user.Username });

    // Set cookie (with await)
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({
      status: 'OK',
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({
      status: 'ERR',
      message: 'Server error: ' + error.message,
    });
  }
}