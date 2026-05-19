import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).player || (session as any).player.role !== "ADMIN") {
    redirect("/");
  }

  const totalPlayers = await prisma.player.count();
  const totalGames = await prisma.game.count();
  const activeGames = await prisma.game.count({ where: { status: "active" } });
  
  const games = await prisma.game.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      players: true,
      host: true
    }
  });

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main style={{ marginTop: "20px" }}>
        <div className="screen" style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
          <div>
            <h3>Total Players</h3>
            <p style={{ fontSize: "2rem", color: "var(--primary-color)", margin: "10px 0" }}>{totalPlayers}</p>
          </div>
          <div>
            <h3>Total Games</h3>
            <p style={{ fontSize: "2rem", color: "var(--primary-color)", margin: "10px 0" }}>{totalGames}</p>
          </div>
          <div>
            <h3>Active Games</h3>
            <p style={{ fontSize: "2rem", color: "var(--success-color)", margin: "10px 0" }}>{activeGames}</p>
          </div>
        </div>

        <div className="screen">
          <h2>All Games History</h2>
          {games.length === 0 ? <p>No games played yet.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {games.map(game => {
                const totalPot = game.players.reduce((sum, p) => sum + p.buyIns, 0) * game.chipValue;
                return (
                  <li key={game.id} className="player-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "10px" }}>
                      <strong>Code: {game.code}</strong>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ 
                          color: game.status === 'active' ? 'var(--success-color)' : 
                                 game.status === 'cashout' ? 'var(--danger-color)' : '#aaa' 
                        }}>
                          {game.status.toUpperCase()}
                        </span>
                        <Link href={`/game/${game.code}`}>
                          <button className="secondary-btn" style={{ padding: "2px 8px", fontSize: "0.8rem", width: "auto", margin: 0 }}>View</button>
                        </Link>
                      </div>
                    </div>
                    <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
                      Host: {game.host?.name || "Unknown"} | Players: {game.players.length} | Pot: <strong style={{ color: "var(--success-color)"}}>${totalPot.toFixed(2)}</strong>
                    </div>
                    <div style={{ color: "#666", fontSize: "0.8rem", marginTop: "5px" }}>
                      Created: {new Date(game.createdAt).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
