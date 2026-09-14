import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  try {
    const persons = await prisma.person.findMany({
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(persons);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch persons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const person = await prisma.person.create({
      data: { name: body.name, nameAr: body.nameAr, employeeId: body.employeeId, departmentId: body.departmentId },
    });
    return NextResponse.json(person, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
