import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { ensureAssetQrToken } from '@/lib/qr-token';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const result = await requirePermission(PERMISSIONS.VIEW_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const qrToken = await ensureAssetQrToken(params.id);
    return NextResponse.json({ qrToken });
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR token' }, { status: 500 });
  }
}
