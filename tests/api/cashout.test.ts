import { POST } from '@/app/api/games/cashout/route';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

const makeRequest = (body: object) =>
  new Request('http://localhost/api/games/cashout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/games/cashout', () => {
  const hostSession = { player: { id: 'alice-id', role: 'PLAYER' } };
  const bobSession  = { player: { id: 'bob-id',   role: 'PLAYER' } };

  const cashoutGame = {
    id: 'game-1', status: 'cashout', hostId: 'alice-id',
    chipValue: 10, chipsQty: 100,
  };

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ gameId: 'game-1', playersData: [] }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-host tries to submit cashout', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(cashoutGame);
    const res = await POST(makeRequest({ gameId: 'game-1', playersData: [] }));
    expect(res.status).toBe(403);
  });

  it('creates correct ledger entry for simple 1v1 debt', async () => {
    // Alice bought in 2x ($20 cost), ends with 0 chips → lost $20
    // Bob   bought in 2x ($20 cost), ends with 200 chips → $20 value → broke even... 
    // Let's do: Alice 1 buyin ($10 cost), ends with 0 → lost $10
    //           Bob   1 buyin ($10 cost), ends with 200 → worth $20 → profit $10
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(cashoutGame);
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({});
    (prismaMock.gamePlayer.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'alice-id', buyIns: 1, finalChips: 0,   player: { name: 'Alice' } },
      { playerId: 'bob-id',   buyIns: 1, finalChips: 200, player: { name: 'Bob' }   },
    ]);
    (prismaMock.ledger.create as jest.Mock).mockResolvedValue({});
    (prismaMock.game.update as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({
      gameId: 'game-1',
      playersData: [
        { playerId: 'gp-alice', finalChips: 0 },
        { playerId: 'gp-bob',   finalChips: 200 },
      ],
    }));

    expect(res.status).toBe(200);
    // Alice owes Bob $10
    expect(prismaMock.ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromPlayerId: 'alice-id',
          toPlayerId: 'bob-id',
          amount: 10,
        }),
      })
    );
  });

  it('creates zero ledger entries when everyone breaks even', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(cashoutGame);
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({});
    (prismaMock.gamePlayer.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'alice-id', buyIns: 1, finalChips: 100, player: { name: 'Alice' } },
      { playerId: 'bob-id',   buyIns: 1, finalChips: 100, player: { name: 'Bob' }   },
    ]);
    (prismaMock.game.update as jest.Mock).mockResolvedValue({});

    const res = await POST(makeRequest({
      gameId: 'game-1',
      playersData: [
        { playerId: 'gp-alice', finalChips: 100 },
        { playerId: 'gp-bob',   finalChips: 100 },
      ],
    }));

    expect(res.status).toBe(200);
    expect(prismaMock.ledger.create).not.toHaveBeenCalled();
  });

  it('transitions game to completed status', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(cashoutGame);
    (prismaMock.gamePlayer.update as jest.Mock).mockResolvedValue({});
    (prismaMock.gamePlayer.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'alice-id', buyIns: 1, finalChips: 100, player: { name: 'Alice' } },
    ]);
    (prismaMock.game.update as jest.Mock).mockResolvedValue({});

    await POST(makeRequest({ gameId: 'game-1', playersData: [] }));
    expect(prismaMock.game.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'completed' } })
    );
  });
});
