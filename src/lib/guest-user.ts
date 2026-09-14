import { SessionUser } from './auth';
import { PERMISSION_DEFINITIONS, PermissionKey } from './permissions';

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_DEFINITIONS.map((p) => p.key);

export function createOpenAccessUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 'system',
    username: 'System',
    roleId: 'open-access',
    roleName: 'Open Access',
    permissions: ALL_PERMISSIONS,
    canChangeUsername: false,
    ...overrides,
  };
}
