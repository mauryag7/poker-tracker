import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).player) {
    redirect("/login");
  }

  const playerId = (session as any).player.id;

  const gamePlayers = await prisma.gamePlayer.findMany({
    where: { playerId },
    include: {
      game: {
        include: {
          players: true
        }
      }
    },
    orderBy: {
      game: {
        createdAt: 'desc'
      }
    }
  });

  let totalProfit = 0;
  let totalGames = gamePlayers.length;
  
  const historyData = gamePlayers.map(gp => {
    const game = gp.game;
    const totalCost = gp.buyIns * game.chipValue;

    // Bug 7 fix: if game is completed but finalChips is null, the player was
    // kicked before cashout — treat as a forfeited entry, not a loss
    const wasKickedOrPending = game.status === 'completed' && gp.finalChips === null;
    const finalValue = wasKickedOrPending ? 0 : ((gp.finalChips || 0) / game.chipsQty) * game.chipValue;
    const profit = wasKickedOrPending ? 0 : finalValue - totalCost;
    
    if (game.status === 'completed' && !wasKickedOrPending) {
      totalProfit += profit;
    }

    return {
      game,
      buyIns: gp.buyIns,
      finalChips: gp.finalChips,
      profit,
      wasKickedOrPending
    };
  });

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>My History</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="/"><button className="secondary-btn" style={{ margin: 0, padding: "5px 10px", width: "auto" }}>Back to Lobby</button></Link>
        </div>
      </header>

      <main style={{ marginTop: "20px" }}>
        <div className="screen" style={{ textAlign: "center" }}>
          <h2>All-Time Net Profit</h2>
          <p style={{ 
            fontSize: "3rem", 
            margin: "10px 0", 
            fontWeight: "bold",
            color: totalProfit >= 0 ? "var(--success-color)" : "var(--danger-color)"
          }}>
            {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
          </p>
          <p style={{ color: "#aaa" }}>Across {totalGames} games</p>
        </div>

        <div className="screen">
          <h2>Past Games</h2>
          {historyData.length === 0 ? <p>You haven't played any games yet.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {historyData.map(data => (
                <li key={data.game.id} className="player-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "10px" }}>
                    <strong>{new Date(data.game.createdAt).toLocaleDateString()}</strong>
                    <span style={{ 
                      fontWeight: "bold",
                      color: data.wasKickedOrPending ? '#888' : data.game.status !== 'completed' ? '#aaa' : data.profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                    }}>
                      {data.wasKickedOrPending ? 'Kicked' : data.game.status !== 'completed' ? 'In Progress' : (data.profit >= 0 ? "+" : "") + "$" + data.profit.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ color: "#aaa", fontSize: "0.9rem", display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <span>Buy-ins: {data.buyIns} (${(data.buyIns * data.game.chipValue).toFixed(2)})</span>
                    <span>Status: {data.game.status.toUpperCase()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
