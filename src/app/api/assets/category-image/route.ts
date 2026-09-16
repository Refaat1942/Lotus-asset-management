import { NextRequest, NextResponse } from 'next/server';
import { fetchWikiImage, getAssetImageUrl } from '@/lib/asset-images';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const category = request.nextUrl.searchParams.get('category') || '';
  const name = request.nextUrl.searchParams.get('name') || '';
  const device = request.nextUrl.searchParams.get('device') || '';
  const manufacturer = request.nextUrl.searchParams.get('manufacturer') || '';

  const searchTerm = q || category || name || device || 'computer equipment';
  const wikiImage = await fetchWikiImage(searchTerm);
  const fallback = getAssetImageUrl(category, name, device, manufacturer);

  return NextResponse.json(
    { url: wikiImage || fallback },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  );
}
