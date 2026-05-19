import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '@/lib/prisma';

// Re-export the prisma mock for use in tests
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Auto-reset mock state between each test
beforeEach(() => {
  mockReset(prismaMock);
});
