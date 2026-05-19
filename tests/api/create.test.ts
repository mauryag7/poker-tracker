import { POST } from '@/app/api/games/create/route';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

const makeRequest = (body: object) =>
  new Request('http://localhost/api/games/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/games/create', () => {
  const playerSession = { player: { id: 'alice-id', role: 'PLAYER' } };
  const adminSession  = { player: { id: 'admin-id', role: 'ADMIN' } };

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when admin tries to create a game', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/Admins cannot create/);
  });

  it('returns 400 when chipValue is 0', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    const res = await POST(makeRequest({ chipValue: '0', chipsQty: '100' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/greater than zero/);
  });

  it('returns 400 when chipsQty is negative', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '-5' }));
    expect(res.status).toBe(400);
  });

  it('retries on code collision and returns 201 on second unique code', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    // First findUnique returns an existing game (collision), second returns null (unique)
    (prismaMock.game.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'existing-game' })
      .mockResolvedValueOnce(null);
    (prismaMock.game.create as jest.Mock).mockResolvedValue({ id: 'new-game', code: '1234' });
    (prismaMock.gamePlayer.create as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100' }));
    expect(res.status).toBe(201);
    // findUnique should have been called twice (once for collision, once for unique)
    expect(prismaMock.game.findUnique).toHaveBeenCalledTimes(2);
  });

  it('creates game and host gamePlayer on success with allowPlayerBuyins=true', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.game.create as jest.Mock).mockResolvedValue({ id: 'new-game', code: '5678' });
    (prismaMock.gamePlayer.create as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100', allowPlayerBuyins: true }));
    expect(res.status).toBe(201);
    expect(prismaMock.game.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          allowPlayerBuyins: true
        })
      })
    );
  });

  it('creates game and host gamePlayer on success with allowPlayerBuyins=false', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.game.create as jest.Mock).mockResolvedValue({ id: 'new-game', code: '5678' });
    (prismaMock.gamePlayer.create as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100', allowPlayerBuyins: false }));
    expect(res.status).toBe(201);
    expect(prismaMock.game.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          allowPlayerBuyins: false
        })
      })
    );
  });

  it('creates game and host gamePlayer on success with default allowPlayerBuyins=false', async () => {
    mockGetServerSession.mockResolvedValue(playerSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.game.create as jest.Mock).mockResolvedValue({ id: 'new-game', code: '5678' });
    (prismaMock.gamePlayer.create as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({ chipValue: '10', chipsQty: '100' }));
    expect(res.status).toBe(201);
    expect(prismaMock.game.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          allowPlayerBuyins: false
        })
      })
    );
  });
});
