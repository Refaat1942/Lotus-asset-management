import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { PermissionKey } from './permissions';
import { createOpenAccessUser } from './guest-user';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lotus-asset-management-dev-secret-change-in-production'
);

const COOKIE_NAME = 'lotus_session';
const TOKEN_EXPIRY = '24h';

export interface SessionUser {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  canChangeUsername: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    roleId: user.roleId,
    roleName: user.roleName,
    permissions: user.permissions,
    canChangeUsername: user.canChangeUsername,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      roleId: payload.roleId as string,
      roleName: payload.roleName as string,
      permissions: payload.permissions as string[],
      canChangeUsername: payload.canChangeUsername as boolean,
    };
  } catch {
    return null;
  }
}

let openAccessUserCache: SessionUser | null = null;

export async function getOpenAccessUser(): Promise<SessionUser> {
  if (openAccessUserCache) return openAccessUserCache;

  const user = await prisma.user.findFirst({
    where: { isActive: true, username: 'admin' },
    include: { role: true },
  }) ?? await prisma.user.findFirst({
    where: { isActive: true },
    include: { role: true },
    orderBy: { createdAt: 'asc' },
  });

  openAccessUserCache = createOpenAccessUser(
    user
      ? {
          id: user.id,
          roleId: user.roleId,
          roleName: user.role.name,
        }
      : {}
  );

  return openAccessUserCache;
}

export async function getSession(): Promise<SessionUser | null> {
  return getOpenAccessUser();
}

export async function getUserWithPermissions(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    canChangeUsername: user.canChangeUsername,
  };
}

export async function authenticateUser(username: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { username, isActive: true },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    username: user.username,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    canChangeUsername: user.canChangeUsername,
  };
}

export function checkPermission(_user: SessionUser | null, _permission: PermissionKey): boolean {
  return true;
}

export { COOKIE_NAME };
