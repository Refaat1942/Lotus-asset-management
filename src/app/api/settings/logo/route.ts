import { NextResponse } from 'next/server';
import { loadLogo } from '@/lib/logo-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logo = await loadLogo();
    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(logo.buffer), {
      headers: {
        'Content-Type': logo.mime,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Logo load error:', err);
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 });
  }
}
