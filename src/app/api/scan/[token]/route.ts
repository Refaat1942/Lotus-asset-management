import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public scan — redirect to login with no asset data exposed */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}
