import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ status: 'ERR', message: 'Username and password required' });
    }

    const result = await query(
      'SELECT "AdminId", "Username", "PasswordHash", "FullName" FROM "AdminUsers" WHERE "Username" = $1',
      [username]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: 'ERR', message: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check if password is plain text or hashed
    let isValidPassword = false;

    if (user.PasswordHash.startsWith('$2a$') || user.PasswordHash.startsWith('$2b$')) {
      // Hashed password - use bcrypt
      isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    } else {
      // Plain text password (backward compatibility)
      isValidPassword = user.PasswordHash === password;
    }

    if (!isValidPassword) {
      return NextResponse.json({ status: 'ERR', message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = sign(
      { userId: user.AdminId, username: user.Username },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({
      status: 'OK',
      message: 'Login successful',
      user: { username: user.Username, fullName: user.FullName },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}