/**
 * One-time repair: copy logo file from public/uploads into the database.
 * Run on VPS: npx tsx scripts/sync-logo-to-db.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function main() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    console.log('No uploads directory found.');
    return;
  }

  const logoFile = fs.readdirSync(uploadDir).find((f) => f.startsWith('logo.'));
  if (!logoFile) {
    console.log('No logo file found in public/uploads.');
    return;
  }

  const filePath = path.join(uploadDir, logoFile);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(logoFile);

  await prisma.systemSetting.upsert({
    where: { key: 'company_logo' },
    update: { value: `/uploads/${logoFile}` },
    create: { key: 'company_logo', value: `/uploads/${logoFile}` },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'company_logo_data' },
    update: { value: buffer.toString('base64') },
    create: { key: 'company_logo_data', value: buffer.toString('base64') },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'company_logo_mime' },
    update: { value: MIME[ext] || 'image/png' },
    create: { key: 'company_logo_mime', value: MIME[ext] || 'image/png' },
  });

  console.log(`Synced ${logoFile} to database (${buffer.length} bytes).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
