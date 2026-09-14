import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Public endpoint — returns only non-sensitive asset tag info */
export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { qrToken: params.token },
      select: { assetCode: true, status: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      assetCode: asset.assetCode,
      status: asset.status,
      secured: true,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
