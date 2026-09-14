import { NextResponse } from 'next/server';
import { getOpenAccessUser } from '@/lib/auth';

export async function GET() {
  const user = await getOpenAccessUser();
  return NextResponse.json({ user });
}
