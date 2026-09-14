import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkPermission, SessionUser } from './auth';
import { PermissionKey } from './permissions';

export async function requireAuth(): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { user };
}

export async function requirePermission(
  permission: PermissionKey
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!checkPermission(result.user, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return result;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('lotus_session')?.value || null;
}
