import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateQrToken(): string {
  return randomBytes(24).toString('base64url');
}

async function main() {
  const assets = await prisma.asset.findMany({
    where: { qrToken: null },
    select: { id: true, assetCode: true },
  });

  for (const asset of assets) {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { qrToken: generateQrToken() },
    });
  }

  console.log(`Generated QR tokens for ${assets.length} assets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
