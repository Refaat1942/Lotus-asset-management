import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createToken, COOKIE_NAME, useSecureCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: useSecureCookies(),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Authentication failed') || message.includes('connect') || message.includes('P1000') || message.includes('P1001')) {
      return NextResponse.json({
        error: 'Database connection failed. Run scripts/setup-windows.ps1 to configure PostgreSQL.',
      }, { status: 503 });
    }
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
