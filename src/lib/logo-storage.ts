import * as fs from 'fs';
import * as path from 'path';
import { prisma } from './prisma';

const LOGO_FILE_PREFIX = 'logo';
const LOGO_PATH_KEY = 'company_logo';
const LOGO_DATA_KEY = 'company_logo_data';
const LOGO_MIME_KEY = 'company_logo_mime';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR;
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), 'public', 'uploads');
}

export function getLogoApiUrl(): string {
  return '/api/settings/logo';
}

function mimeFromExt(ext: string): string {
  return MIME_TYPES[ext.toLowerCase()] || 'image/png';
}

function resolveLogoFile(storedPath?: string | null): string | null {
  const uploadDir = getUploadDir();

  if (storedPath?.startsWith('/uploads/')) {
    const fromPublic = path.join(process.cwd(), 'public', storedPath);
    if (fs.existsSync(fromPublic)) return fromPublic;
    const fromUploadDir = path.join(uploadDir, path.basename(storedPath));
    if (fs.existsSync(fromUploadDir)) return fromUploadDir;
  }

  if (storedPath && !storedPath.startsWith('/api/') && fs.existsSync(storedPath)) {
    return storedPath;
  }

  if (!fs.existsSync(uploadDir)) return null;

  const logoFile = fs.readdirSync(uploadDir).find((file) => file.startsWith(LOGO_FILE_PREFIX));
  return logoFile ? path.join(uploadDir, logoFile) : null;
}

export async function saveLogo(file: File): Promise<{ logoUrl: string }> {
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.name) || '.png';
  const fileName = `${LOGO_FILE_PREFIX}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(filePath, buffer);

  const mime = file.type || mimeFromExt(ext);
  const storedPath = `/uploads/${fileName}`;

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: LOGO_PATH_KEY },
      update: { value: storedPath },
      create: { key: LOGO_PATH_KEY, value: storedPath },
    }),
    prisma.systemSetting.upsert({
      where: { key: LOGO_DATA_KEY },
      update: { value: buffer.toString('base64') },
      create: { key: LOGO_DATA_KEY, value: buffer.toString('base64') },
    }),
    prisma.systemSetting.upsert({
      where: { key: LOGO_MIME_KEY },
      update: { value: mime },
      create: { key: LOGO_MIME_KEY, value: mime },
    }),
  ]);

  return { logoUrl: getLogoApiUrl() };
}

export async function loadLogo(): Promise<{ buffer: Buffer; mime: string } | null> {
  const [pathSetting, dataSetting, mimeSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: LOGO_PATH_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: LOGO_DATA_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: LOGO_MIME_KEY } }),
  ]);

  const filePath = resolveLogoFile(pathSetting?.value);
  if (filePath) {
    const ext = path.extname(filePath);
    return {
      buffer: fs.readFileSync(filePath),
      mime: mimeSetting?.value || mimeFromExt(ext),
    };
  }

  if (dataSetting?.value) {
    return {
      buffer: Buffer.from(dataSetting.value, 'base64'),
      mime: mimeSetting?.value || 'image/png',
    };
  }

  return null;
}

export async function hasLogo(): Promise<boolean> {
  const pathSetting = await prisma.systemSetting.findUnique({ where: { key: LOGO_PATH_KEY } });
  const dataSetting = await prisma.systemSetting.findUnique({ where: { key: LOGO_DATA_KEY } });
  return Boolean(pathSetting?.value || dataSetting?.value);
}
