import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

function isValidImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const images = await prisma.categoryImage.findMany();
  return NextResponse.json(images);
}

export async function PUT(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.EDIT_ASSETS);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const category = typeof body.category === 'string' ? body.category.trim() : '';

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }
  if (!isValidImageUrl(body.imageUrl)) {
    return NextResponse.json({ error: 'A valid http(s) image URL is required' }, { status: 400 });
  }

  const image = await prisma.categoryImage.upsert({
    where: { category },
    create: { category, imageUrl: body.imageUrl },
    update: { imageUrl: body.imageUrl },
  });

  return NextResponse.json(image);
}

export async function DELETE(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.EDIT_ASSETS);
  if (result instanceof NextResponse) return result;

  const category = request.nextUrl.searchParams.get('category') || '';
  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  await prisma.categoryImage.deleteMany({ where: { category } });
  return NextResponse.json({ success: true });
}
