import { POST as kickPOST } from '@/app/api/games/kick/route';
import { POST as endPOST }  from '@/app/api/games/end/route';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

const makeReq = (url: string, body: object) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ──────────────────────────────────────────────
// KICK
// ──────────────────────────────────────────────
describe('POST /api/games/kick', () => {
  const hostSession = { player: { id: 'host-id', role: 'PLAYER' } };
  const bobSession  = { player: { id: 'bob-id',  role: 'PLAYER' } };
  const activeGame  = { id: 'game-1', status: 'active', hostId: 'host-id' };
  const bobGP       = { id: 'gp-bob', playerId: 'bob-id', gameId: 'game-1' };

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await kickPOST(makeReq('/api/games/kick', { gameId: 'game-1', playerId: 'gp-bob' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-host tries to kick', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    const res = await kickPOST(makeReq('/api/games/kick', { gameId: 'game-1', playerId: 'gp-bob' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when host tries to kick themselves', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    const hostGP = { id: 'gp-host', playerId: 'host-id', gameId: 'game-1' };
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(hostGP);
    const res = await kickPOST(makeReq('/api/games/kick', { gameId: 'game-1', playerId: 'gp-host' }));
    expect(res.status).toBe(400);
  });

  it('deletes player and returns 200 on valid kick', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.gamePlayer.findUnique as jest.Mock).mockResolvedValue(bobGP);
    (prismaMock.gamePlayer.delete as jest.Mock).mockResolvedValue(bobGP);
    const res = await kickPOST(makeReq('/api/games/kick', { gameId: 'game-1', playerId: 'gp-bob' }));
    expect(res.status).toBe(200);
    expect(prismaMock.gamePlayer.delete).toHaveBeenCalledWith({ where: { id: 'gp-bob' } });
  });
});

// ──────────────────────────────────────────────
// END GAME
// ──────────────────────────────────────────────
describe('POST /api/games/end', () => {
  const hostSession = { player: { id: 'host-id', role: 'PLAYER' } };
  const bobSession  = { player: { id: 'bob-id',  role: 'PLAYER' } };
  const activeGame  = { id: 'game-1', status: 'active', hostId: 'host-id' };

  it('returns 403 when non-host tries to end game', async () => {
    mockGetServerSession.mockResolvedValue(bobSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    const res = await endPOST(makeReq('/api/games/end', { gameId: 'game-1' }));
    expect(res.status).toBe(403);
  });

  it('transitions game to cashout status', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(activeGame);
    (prismaMock.game.update as jest.Mock).mockResolvedValue({ ...activeGame, status: 'cashout' });
    const res = await endPOST(makeReq('/api/games/end', { gameId: 'game-1' }));
    expect(res.status).toBe(200);
    expect(prismaMock.game.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'cashout' } })
    );
  });

  it('returns 404 when game not found', async () => {
    mockGetServerSession.mockResolvedValue(hostSession);
    (prismaMock.game.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await endPOST(makeReq('/api/games/end', { gameId: 'bad-id' }));
    expect(res.status).toBe(404);
  });
});
