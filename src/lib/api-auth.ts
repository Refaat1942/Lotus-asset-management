import { NextRequest } from 'next/server';
import { getOpenAccessUser, SessionUser } from './auth';
import { PermissionKey } from './permissions';

export async function requireAuth(): Promise<{ user: SessionUser }> {
  const user = await getOpenAccessUser();
  return { user };
}

export async function requirePermission(
  _permission: PermissionKey
): Promise<{ user: SessionUser }> {
  const user = await getOpenAccessUser();
  return { user };
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('lotus_session')?.value || null;
}
