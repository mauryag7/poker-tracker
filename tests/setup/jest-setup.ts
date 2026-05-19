import '@testing-library/jest-dom';

// Mock the Prisma singleton so API tests never hit a real DB
jest.mock('@/lib/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return { prisma: mockDeep() };
});

// Mock Pusher server so API tests don't fire real events
jest.mock('@/lib/pusher', () => ({
  pusherServer: {
    trigger: jest.fn().mockResolvedValue({}),
  },
}));
