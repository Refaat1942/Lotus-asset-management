import { randomBytes } from 'crypto';
import { prisma } from './prisma';

export function generateQrToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function ensureAssetQrToken(assetId: string): Promise<string> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { qrToken: true },
  });

  if (asset?.qrToken) return asset.qrToken;

  const qrToken = generateQrToken();
  await prisma.asset.update({
    where: { id: assetId },
    data: { qrToken },
  });
  return qrToken;
}
