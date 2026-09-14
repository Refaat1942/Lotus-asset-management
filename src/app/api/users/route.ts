import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const result = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (result instanceof NextResponse) return result;

  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    const safeUsers = users.map(({ passwordHash, ...u }) => u);
    return NextResponse.json(safeUsers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 400 });

    const user = await prisma.user.create({
      data: {
        username: body.username,
        passwordHash: await hashPassword(body.password),
        email: body.email,
        roleId: body.roleId,
        canChangeUsername: body.canChangeUsername || false,
      },
      include: { role: true },
    });

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
