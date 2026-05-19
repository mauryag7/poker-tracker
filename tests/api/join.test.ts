import { POST } from '@/app/api/games/join/route';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

const makeRequest = (body: object) =>
  new Request('http://localhost/api/games/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/games/join', () => {
  const playerSession = { player: { id: 'bob-id', role: 'PLAYER' } };
  const adminSession  = { player: { id: 'admin-id', role: 'ADMIN' } };
  const activeGame    = { id: 'game-1', code: '1234', status: 'active', hostId: 'alice-id' };

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ code: '1234' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when admin tries to join', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ code: '1234' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/Admins cannot join/);
  });

  it('returns 404 when game not found', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ code: '9999' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when game is not active', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue({ ...activeGame, status: 'completed' });
    const res = await POST(makeRequest({ code: '1234' }));
    expect(res.status).toBe(400);
  });

  it('creates gamePlayer when not already joined', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(null); // not yet joined
    (prismaMock.gamePlayer.create as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({ code: '1234' }));
    expect(res.status).toBe(200);
    expect(prismaMock.gamePlayer.create).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate gamePlayer when already joined', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue({ id: 'gp-existing' });

    const res = await POST(makeRequest({ code: '1234' }));
    expect(res.status).toBe(200);
    expect(prismaMock.gamePlayer.create).not.toHaveBeenCalled();
  });
});
