export const PERMISSIONS = {
  VIEW_ASSETS: 'view_assets',
  CREATE_ASSETS: 'create_assets',
  EDIT_ASSETS: 'edit_assets',
  DELETE_ASSETS: 'delete_assets',
  ASSIGN_ASSETS: 'assign_assets',
  TRANSFER_ASSETS: 'transfer_assets',
  VIEW_ASSET_HISTORY: 'view_asset_history',
  IMPORT_EXCEL: 'import_excel',
  EXPORT_EXCEL: 'export_excel',
  VIEW_REPORTS: 'view_reports',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_BRANCHES: 'manage_branches',
  MANAGE_USERS: 'manage_users',
  MANAGE_AUTHORIZATION: 'manage_authorization',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DEFINITIONS: {
  key: PermissionKey;
  name: string;
  nameAr: string;
  category: string;
}[] = [
  { key: PERMISSIONS.VIEW_ASSETS, name: 'View Assets', nameAr: 'عرض الأصول', category: 'assets' },
  { key: PERMISSIONS.CREATE_ASSETS, name: 'Create Assets', nameAr: 'إنشاء الأصول', category: 'assets' },
  { key: PERMISSIONS.EDIT_ASSETS, name: 'Edit Assets', nameAr: 'تعديل الأصول', category: 'assets' },
  { key: PERMISSIONS.DELETE_ASSETS, name: 'Delete Assets', nameAr: 'حذف الأصول', category: 'assets' },
  { key: PERMISSIONS.ASSIGN_ASSETS, name: 'Assign Assets', nameAr: 'تعيين الأصول', category: 'assets' },
  { key: PERMISSIONS.TRANSFER_ASSETS, name: 'Transfer Assets', nameAr: 'نقل الأصول', category: 'assets' },
  { key: PERMISSIONS.VIEW_ASSET_HISTORY, name: 'View Asset History', nameAr: 'عرض سجل الأصول', category: 'assets' },
  { key: PERMISSIONS.IMPORT_EXCEL, name: 'Import Excel', nameAr: 'استيراد Excel', category: 'data' },
  { key: PERMISSIONS.EXPORT_EXCEL, name: 'Export Excel', nameAr: 'تصدير Excel', category: 'data' },
  { key: PERMISSIONS.VIEW_REPORTS, name: 'View Reports', nameAr: 'عرض التقارير', category: 'reports' },
  { key: PERMISSIONS.MANAGE_DEPARTMENTS, name: 'Manage Departments', nameAr: 'إدارة الأقسام', category: 'admin' },
  { key: PERMISSIONS.MANAGE_BRANCHES, name: 'Manage Branches', nameAr: 'إدارة الفروع', category: 'admin' },
  { key: PERMISSIONS.MANAGE_USERS, name: 'Manage Users', nameAr: 'إدارة المستخدمين', category: 'admin' },
  { key: PERMISSIONS.MANAGE_AUTHORIZATION, name: 'Manage Authorization', nameAr: 'إدارة الصلاحيات', category: 'admin' },
  { key: PERMISSIONS.MANAGE_SETTINGS, name: 'Manage Settings', nameAr: 'إدارة الإعدادات', category: 'admin' },
];

export function hasPermission(userPermissions: string[], permission: PermissionKey): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(userPermissions: string[], permissions: PermissionKey[]): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}
