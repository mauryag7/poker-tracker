import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test env before importing prisma
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

import { prisma } from '../../src/lib/prisma';

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test database...');
  // Delete in FK-safe order: children first
  await prisma.ledger.deleteMany({});
  await prisma.gamePlayer.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.player.deleteMany({});
  console.log('✅ Test database cleaned');
  await prisma.$disconnect();
}
