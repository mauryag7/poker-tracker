/**
 * Simplifies debts between players using a greedy algorithm.
 * Returns a list of transactions that settle all debts with minimum transfers.
 */
export interface PlayerResult {
  playerId: string;
  buyIns: number;
  finalChips: number | null;
  chipValue: number;
  chipsQty: number;
}

export interface Transaction {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
}

export function simplifyDebts(players: PlayerResult[]): Transaction[] {
  const debtors: { playerId: string; amount: number }[] = [];
  const creditors: { playerId: string; amount: number }[] = [];

  players.forEach((p) => {
    const totalCost = p.buyIns * p.chipValue;
    const finalValue = ((p.finalChips || 0) / p.chipsQty) * p.chipValue;
    const profit = finalValue - totalCost;

    if (profit < -0.001) debtors.push({ playerId: p.playerId, amount: Math.abs(profit) });
    else if (profit > 0.001) creditors.push({ playerId: p.playerId, amount: profit });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor   = debtors[i];
    const creditor = creditors[j];
    const amount   = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    transactions.push({ fromPlayerId: debtor.playerId, toPlayerId: creditor.playerId, amount });

    debtor.amount   -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.001)   i++;
    if (creditor.amount < 0.001) j++;
  }

  return transactions;
}
