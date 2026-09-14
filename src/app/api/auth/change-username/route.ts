import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!result.user.canChangeUsername) {
    return NextResponse.json({ error: 'Not permitted to change username' }, { status: 403 });
  }

  try {
    const { newUsername } = await request.json();
    if (!newUsername || newUsername.length < 3) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username: newUsername } });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: result.user.id },
      data: { username: newUsername },
    });

    return NextResponse.json({ success: true, username: newUsername });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
