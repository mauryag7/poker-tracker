import { simplifyDebts, PlayerResult } from '@/lib/simplifyDebts';

const makePlayer = (playerId: string, buyIns: number, finalChips: number | null): PlayerResult => ({
  playerId,
  buyIns,
  finalChips,
  chipValue: 10,  // $10 per buy-in
  chipsQty: 100,  // 100 chips per buy-in
});

describe('simplifyDebts', () => {
  it('returns empty array when everyone breaks even', () => {
    const players = [
      makePlayer('alice', 1, 100), // bought $10, worth $10 → even
      makePlayer('bob',   1, 100),
    ];
    expect(simplifyDebts(players)).toHaveLength(0);
  });

  it('creates one transaction for simple 1v1 debt', () => {
    // Alice: 1 buyin ($10 cost), 0 chips → lost $10
    // Bob:   1 buyin ($10 cost), 200 chips → worth $20 → profit $10
    const players = [
      makePlayer('alice', 1, 0),
      makePlayer('bob',   1, 200),
    ];
    const txs = simplifyDebts(players);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ fromPlayerId: 'alice', toPlayerId: 'bob', amount: 10 });
  });

  it('minimises transactions with multiple debtors and creditors', () => {
    // Alice: 1 buyin ($10), 0 chips → -$10
    // Bob:   1 buyin ($10), 0 chips → -$10
    // Carol: 1 buyin ($10), 300 chips → +$20 net profit
    // (Alice owes Carol $10, Bob owes Carol $10)
    const players = [
      makePlayer('alice', 1, 0),
      makePlayer('bob',   1, 0),
      makePlayer('carol', 1, 300),
    ];
    const txs = simplifyDebts(players);
    expect(txs).toHaveLength(2);
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBeCloseTo(20);
    txs.forEach(tx => expect(tx.toPlayerId).toBe('carol'));
  });

  it('handles multi-debtor multi-creditor with minimum transfers', () => {
    // Alice: -$30, Bob: -$10, Carol: +$20, Dave: +$20
    const players = [
      makePlayer('alice', 3, 0),    // cost $30, 0 chips → -$30
      makePlayer('bob',   1, 0),    // cost $10, 0 chips → -$10
      makePlayer('carol', 1, 300),  // cost $10, $30 value → +$20
      makePlayer('dave',  1, 300),  // cost $10, $30 value → +$20
    ];
    const txs = simplifyDebts(players);
    // Total debt = $40, should be settled in at most 3 transactions
    expect(txs.length).toBeLessThanOrEqual(3);
    const totalPaid = txs.reduce((s, t) => s + t.amount, 0);
    expect(totalPaid).toBeCloseTo(40);
  });

  it('handles null finalChips (treats as 0 chips)', () => {
    const players = [
      makePlayer('alice', 1, null), // -$10 (no chips)
      makePlayer('bob',   1, 200),  // +$10
    ];
    const txs = simplifyDebts(players);
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBeCloseTo(10);
  });

  it('handles floating point amounts correctly', () => {
    // $5.50 chipValue scenario
    const players: PlayerResult[] = [
      { playerId: 'alice', buyIns: 3, finalChips: 0,   chipValue: 5.50, chipsQty: 100 },
      { playerId: 'bob',   buyIns: 3, finalChips: 600, chipValue: 5.50, chipsQty: 100 },
    ];
    const txs = simplifyDebts(players);
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBeCloseTo(16.5);
  });
});
