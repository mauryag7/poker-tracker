import { FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import bcrypt from 'bcryptjs';

// Load test env before importing prisma
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

import { prisma } from '../../src/lib/prisma';

export const TEST_USERS = {
  alice: { email: 'alice@e2e.test', name: 'Alice', password: 'Password123', role: 'PLAYER' },
  bob:   { email: 'bob@e2e.test',   name: 'Bob',   password: 'Password123', role: 'PLAYER' },
  admin: { email: 'admin@e2e.test', name: 'Admin', password: 'Password123', role: 'ADMIN'  },
};

async function seedPlayer(data: typeof TEST_USERS.alice) {
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.player.upsert({
    where:  { email: data.email },
    update: { role: data.role },
    create: { email: data.email, name: data.name, password: hashed, role: data.role },
  });
}

export default async function globalSetup(config: FullConfig) {
  console.log('\n🌱 Seeding test database...');
  await seedPlayer(TEST_USERS.alice);
  await seedPlayer(TEST_USERS.bob);
  await seedPlayer(TEST_USERS.admin);
  console.log('✅ Test players seeded (Alice, Bob, Admin)');
  await prisma.$disconnect();
}
