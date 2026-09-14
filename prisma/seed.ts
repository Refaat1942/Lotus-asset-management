import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSION_DEFINITIONS } from '../src/lib/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, nameAr: perm.nameAr, category: perm.category },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: { nameAr: 'مدير النظام', description: 'Full system access', isSystem: true },
    create: {
      name: 'Administrator',
      nameAr: 'مدير النظام',
      description: 'Full system access',
      isSystem: true,
    },
  });

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const viewerPerms = allPermissions.filter((p) =>
    ['view_assets', 'view_asset_history', 'view_reports', 'export_excel'].includes(p.key)
  );

  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: { nameAr: 'مشاهد', description: 'Read-only access' },
    create: { name: 'Viewer', nameAr: 'مشاهد', description: 'Read-only access' },
  });

  for (const perm of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: perm.id },
    });
  }

  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      roleId: adminRole.id,
      canChangeUsername: true,
      email: 'admin@lotus.local',
    },
  });

  await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'Information Technology', nameAr: 'تقنية المعلومات', code: 'IT', description: 'IT Department' },
  });

  await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', nameAr: 'الموارد البشرية', code: 'HR' },
  });

  await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', nameAr: 'المالية', code: 'FIN' },
  });

  await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: { name: 'Head Office', nameAr: 'المقر الرئيسي', code: 'HQ', address: 'Main Street' },
  });

  await prisma.branch.upsert({
    where: { code: 'BR1' },
    update: {},
    create: { name: 'Branch 1', nameAr: 'الفرع الأول', code: 'BR1' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'company_name' },
    update: {},
    create: { key: 'company_name', value: 'Lotus Asset Management' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'company_name_ar' },
    update: {},
    create: { key: 'company_name_ar', value: 'نظام إدارة أصول لوتس' },
  });

  console.log('Seed completed. Default admin: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
