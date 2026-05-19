import { POST } from '@/app/api/games/buyin/route';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

const makeRequest = (body: object) =>
  new Request('http://localhost/api/games/buyin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/games/buyin', () => {
  const hostSession = { player: { id: 'host-id', role: 'PLAYER' } };
  const bobSession  = { player: { id: 'bob-id',  role: 'PLAYER' } };

  const activeGame = { id: 'game-1', status: 'active', hostId: 'host-id', chipValue: 10, chipsQty: 100, allowPlayerBuyins: false };
  const gamePlayer = { id: 'gp-1', playerId: 'bob-id', gameId: 'game-1', buyIns: 2 };

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not the host and allowPlayerBuyins is false', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(gamePlayer);
    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/Only the host/);
  });

  it('returns 403 when caller is not the host, allowPlayerBuyins is true, but tries to update another player', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue({ ...activeGame, allowPlayerBuyins: true });
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue({ ...gamePlayer, playerId: 'other-player-id' });
    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/You can only modify your own buy-ins/);
  });

  it('updates buy-in successfully when caller is not the host, allowPlayerBuyins is true, and updates self', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue({ ...activeGame, allowPlayerBuyins: true });
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(gamePlayer);
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({ ...gamePlayer, buyIns: 3 });

    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(200);
    expect(prismaMock.gamePlayer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { buyIns: 3 } })
    );
  });

  it('returns 400 when game is not active', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue({ ...activeGame, status: 'cashout' });
    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(400);
  });

  it('adds a buy-in successfully', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(gamePlayer);
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({ ...gamePlayer, buyIns: 3 });

    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'add' }));
    expect(res.status).toBe(200);
    expect(prismaMock.gamePlayer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { buyIns: 3 } })
    );
  });

  it('enforces minimum of 1 buy-in when removing', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue({ ...gamePlayer, buyIns: 1 });
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({ ...gamePlayer, buyIns: 1 });

    await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-1', action: 'remove' }));
    expect(prismaMock.gamePlayer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { buyIns: 1 } }) // stays at 1
    );
  });

  it('returns 404 when game player not found', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ gameId: 'game-1', playerId: 'gp-bad', action: 'add' }));
    expect(res.status).toBe(404);
  });
});
