import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function resolveLogoPath(storedValue?: string | null): string | null {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (storedValue?.startsWith('/uploads/')) {
    const candidate = path.join(process.cwd(), 'public', storedValue);
    if (fs.existsSync(candidate)) return candidate;
  }

  if (storedValue && fs.existsSync(storedValue)) return storedValue;

  if (!fs.existsSync(uploadDir)) return null;

  const logoFile = fs.readdirSync(uploadDir).find((file) => file.startsWith('logo.'));
  return logoFile ? path.join(uploadDir, logoFile) : null;
}

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'company_logo' } });
    const filePath = resolveLogoPath(setting?.value);
    if (!filePath) {
      return new NextResponse(null, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
