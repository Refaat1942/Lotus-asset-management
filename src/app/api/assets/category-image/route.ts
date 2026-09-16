import { NextRequest, NextResponse } from 'next/server';
import { resolveCategoryVisual } from '@/lib/asset-images';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || '';
  const name = request.nextUrl.searchParams.get('name') || '';
  const device = request.nextUrl.searchParams.get('device') || '';
  const manufacturer = request.nextUrl.searchParams.get('manufacturer') || '';

  const visual = resolveCategoryVisual(category, name, device, manufacturer);

  return NextResponse.json(
    { url: visual.imageUrl, type: visual.type },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  );
}
