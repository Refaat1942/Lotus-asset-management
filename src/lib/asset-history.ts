import { HistoryEventType, Prisma } from '@prisma/client';
import { prisma } from './prisma';

interface HistoryInput {
  assetId: string;
  eventType: HistoryEventType;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  metadata?: Prisma.InputJsonValue;
  createdById?: string;
}

export async function recordAssetHistory(input: HistoryInput) {
  return prisma.assetHistory.create({
    data: {
      assetId: input.assetId,
      eventType: input.eventType,
      title: input.title,
      titleAr: input.titleAr,
      description: input.description,
      descriptionAr: input.descriptionAr,
      metadata: input.metadata,
      createdById: input.createdById,
    },
  });
}

export async function getAssetHistory(assetId: string) {
  return prisma.assetHistory.findMany({
    where: { assetId },
    include: { createdBy: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
