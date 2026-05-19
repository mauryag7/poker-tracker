"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePusher } from "@/hooks/usePusher";
import ThemeToggle from "@/components/ThemeToggle";

export default function GameClient({ initialGame, playerId, isAdmin = false }: { initialGame: any, playerId: string, isAdmin?: boolean }) {
  const router = useRouter();
  const [game, setGame] = useState(initialGame);
  const [finalChips, setFinalChips] = useState<{ [key: string]: number }>({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [confirmKickPlayerId, setConfirmKickPlayerId] = useState<string | null>(null);
  const [confirmRemoveBuyInPlayerId, setConfirmRemoveBuyInPlayerId] = useState<string | null>(null);
  
  const isHost = game.hostId === playerId;
  
  const fetchGameState = useCallback(async () => {
    const res = await fetch(`/api/games/state?gameId=${game.id}`);
    if (res.ok) {
      const data = await res.json();
      setGame(data.game);
    }
  }, [game.id]);

  usePusher(`game-${game.id}`, 'player-joined', fetchGameState);
  usePusher(`game-${game.id}`, 'game-updated', fetchGameState);
  usePusher(`game-${game.id}`, 'game-ended', fetchGameState);
  usePusher(`game-${game.id}`, 'game-completed', fetchGameState);

  useEffect(() => {
    if (game.status === 'completed') return;
    const interval = setInterval(fetchGameState, 3000);
    return () => clearInterval(interval);
  }, [game.status, fetchGameState]);

  const totalPot = game.players.reduce((sum: number, p: any) => sum + p.buyIns, 0) * game.chipValue;
  const expectedTotalChips = game.players.reduce((sum: number, p: any) => sum + p.buyIns, 0) * game.chipsQty;

  const handleBuyIn = async (playerId: string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      setConfirmRemoveBuyInPlayerId(playerId);
      return;
    }
    const res = await fetch('/api/games/buyin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, playerId, action })
    });
    if (res.ok) {
      fetchGameState();
    }
  };

  const handleRemoveBuyInConfirmed = async (playerId: string) => {
    setConfirmRemoveBuyInPlayerId(null);
    const res = await fetch('/api/games/buyin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, playerId, action: 'remove' })
    });
    if (res.ok) {
      fetchGameState();
    }
  };

  // Bug 6 fix: add confirmation prompt before ending the game
  const handleEndGame = async () => {
    console.log("End Game confirmed! Sending POST /api/games/end...");
    try {
      const res = await fetch('/api/games/end', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id })
      });
      console.log("POST /api/games/end response status:", res.status);
      if (res.ok) {
        console.log("Successfully ended game, fetching new state...");
        fetchGameState();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to end game:", errData);
        alert("Failed to end game: " + (errData.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error in handleEndGame:", err);
      alert("Error in handleEndGame: " + err.message);
    }
  };

  const handleKick = (playerId: string) => {
    setConfirmKickPlayerId(playerId);
  };

  const handleKickConfirmed = async (playerId: string) => {
    setConfirmKickPlayerId(null);
    const res = await fetch('/api/games/kick', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, playerId })
    });
    if (res.ok) {
      fetchGameState();
    }
  };

  const handleCashoutSubmit = async () => {
    const playersData = Object.keys(finalChips).map(id => ({
      playerId: id,
      finalChips: finalChips[id]
    }));
    const res = await fetch('/api/games/cashout', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, playersData })
    });
    if (res.ok) {
      fetchGameState();
    }
  };

  if (game.status === "active") {
    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Live Game</h1>
          <ThemeToggle />
        </header>
        <div className="screen" style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#aaa" }}>Room Code</p>
          <h2 style={{ fontSize: "2rem", letterSpacing: "5px", margin: "10px 0" }}>{game.code}</h2>
          <p>Total Pot: <span style={{ color: "var(--success-color)", fontWeight: "bold", fontSize: "1.2rem" }}>${totalPot.toFixed(2)}</span></p>
        </div>

        <div className="screen">
          <h2>Players</h2>
          {game.players.map((p: any) => {
            const hasActiveConfirm = confirmKickPlayerId === p.id || confirmRemoveBuyInPlayerId === p.id;
            const isSelf = p.playerId === playerId;
            const canModifyBuyins = isHost || (game.allowPlayerBuyins && isSelf);

            return (
              <div key={p.id} className="player-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div>
                    <strong>{p.player.name} {p.playerId === game.hostId ? "(Host)" : ""}</strong>
                    <div style={{ color: "#aaa", fontSize: "0.9rem", marginTop: "4px" }}>Buy-ins: {p.buyIns} (${(p.buyIns * game.chipValue).toFixed(2)})</div>
                  </div>
                  {!isAdmin && !hasActiveConfirm && canModifyBuyins && (
                    <div className="buyin-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isHost && p.playerId !== game.hostId && (
                        <button className="secondary-btn" style={{ padding: "5px 10px", width: "auto", fontSize: "0.8rem", backgroundColor: "var(--danger-color)" }} onClick={() => handleKick(p.id)}>Kick</button>
                      )}
                      <button className="buyin-btn buyin-sub" onClick={() => handleBuyIn(p.id, 'remove')}>-</button>
                      <button className="buyin-btn buyin-add" onClick={() => handleBuyIn(p.id, 'add')}>+</button>
                    </div>
                  )}
                </div>

                {isHost && !isAdmin && confirmKickPlayerId === p.id && (
                  <div style={{ width: "100%", marginTop: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                    <p style={{ color: "var(--danger-color)", fontSize: "0.85rem", margin: "0 0 10px 0", fontWeight: "bold" }}>
                      ⚠️ Kick {p.player.name}? Erases their buy-ins from pot.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="secondary-btn" style={{ flex: 1, padding: "5px 10px", backgroundColor: "var(--danger-color)", fontSize: "0.8rem", width: "auto" }} onClick={() => handleKickConfirmed(p.id)}>Confirm Kick</button>
                      <button className="secondary-btn" style={{ flex: 1, padding: "5px 10px", fontSize: "0.8rem", width: "auto", margin: 0 }} onClick={() => setConfirmKickPlayerId(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {!isAdmin && canModifyBuyins && confirmRemoveBuyInPlayerId === p.id && (
                  <div style={{ width: "100%", marginTop: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                    <p style={{ color: "var(--danger-color)", fontSize: "0.85rem", margin: "0 0 10px 0", fontWeight: "bold" }}>
                      ⚠️ Remove a buy-in for {p.player.name}?
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="secondary-btn" style={{ flex: 1, padding: "5px 10px", backgroundColor: "var(--danger-color)", fontSize: "0.8rem", width: "auto" }} onClick={() => handleRemoveBuyInConfirmed(p.id)}>Confirm Remove</button>
                      <button className="secondary-btn" style={{ flex: 1, padding: "5px 10px", fontSize: "0.8rem", width: "auto", margin: 0 }} onClick={() => setConfirmRemoveBuyInPlayerId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isHost && (
          <div style={{ marginTop: "30px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
            {!showEndConfirm ? (
              <button className="danger-btn" onClick={() => setShowEndConfirm(true)}>End Game</button>
            ) : (
              <div className="screen" style={{ border: "1px solid var(--danger-color)", padding: "15px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
                <p style={{ margin: "0 0 15px 0", color: "var(--danger-color)", fontWeight: "bold" }}>
                  ⚠️ Are you sure you want to end the game? This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="danger-btn" style={{ flex: 1 }} onClick={handleEndGame}>Confirm End Game</button>
                  <button className="secondary-btn" style={{ flex: 1, margin: 0 }} onClick={() => setShowEndConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (game.status === "cashout") {
    if (!isHost) {
      return (
        <div className="container" style={{ textAlign: "center", marginTop: "20vh" }}>
          <h2>Game Ended!</h2>
          <p style={{ color: "#aaa" }}>Waiting for the host to verify final chip counts...</p>
        </div>
      );
    }

    const enteredChips = Object.values(finalChips).reduce((a, b) => a + (Number(b) || 0), 0);
    const remaining = expectedTotalChips - enteredChips;

    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
          <h1 style={{ margin: 0 }}>Cash Out</h1>
          <ThemeToggle />
        </header>
        <div className="screen" style={{ textAlign: "center" }}>
          <p>Total Expected Chips: {expectedTotalChips}</p>
          <h3 style={{ margin: "10px 0" }}>Remaining to account for: </h3>
          <span style={{ color: remaining === 0 ? "var(--success-color)" : "var(--danger-color)", fontWeight: "bold", fontSize: "2rem" }}>{remaining}</span>
        </div>

        {game.players.map((p: any) => (
          <div key={p.id} className="player-card">
            <div>
              <strong>{p.player.name}</strong>
              <div style={{ color: "#aaa", fontSize: "0.9rem", marginTop: "4px" }}>Buy-ins: {p.buyIns}</div>
            </div>
            <input 
              type="number" 
              placeholder="Chips" 
              value={finalChips[p.id] !== undefined ? finalChips[p.id] : ""}
              onChange={(e) => {
                // Bug 4 fix: guard against NaN when input is cleared
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                setFinalChips({ ...finalChips, [p.id]: val });
              }}
              style={{ width: "100px", margin: 0 }}
            />
          </div>
        ))}

        <button className="primary-btn" disabled={remaining !== 0} onClick={handleCashoutSubmit}>Calculate Final Results</button>
      </div>
    );
  }

  if (game.status === "completed") {
    const myDebts = game.ledgers.filter((l: any) => l.fromPlayerId === playerId || l.toPlayerId === playerId);

    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
          <h1 style={{ margin: 0 }}>Game Results</h1>
          <ThemeToggle />
        </header>
        
        {!isAdmin && (
          <div className="screen">
            <h2 style={{ marginBottom: "15px" }}>Your Debt Simplification</h2>
            {myDebts.length === 0 ? <p style={{ color: "#aaa" }}>You broke exactly even! No debts to settle.</p> : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {myDebts.map((l: any) => {
                  if (l.fromPlayerId === playerId) {
                    return <li key={l.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>You owe <strong>{l.toPlayer.name}</strong>: <span style={{color: "var(--danger-color)", fontWeight: "bold"}}>${l.amount.toFixed(2)}</span></li>;
                  } else {
                    return <li key={l.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}><strong>{l.fromPlayer.name}</strong> owes you: <span style={{color: "var(--success-color)", fontWeight: "bold"}}>${l.amount.toFixed(2)}</span></li>;
                  }
                })}
              </ul>
            )}
          </div>
        )}

        {(isHost || isAdmin) && (
          <div className="screen">
            <h2 style={{ marginBottom: "15px", color: "#aaa" }}>{isAdmin ? "Admin View: Master Ledger" : "Host View: Master Ledger"}</h2>
            {game.ledgers.length === 0 ? <p style={{ color: "#aaa" }}>Everyone broke even!</p> : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {game.ledgers.map((l: any) => (
                  <li key={l.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}><strong>{l.fromPlayer.name}</strong> owes <strong>{l.toPlayer.name}</strong>: ${l.amount.toFixed(2)}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Bug 11 fix: use router.push instead of window.location.href */}
        <button className="secondary-btn" onClick={() => router.push('/')}>Back to Lobby</button>
      </div>
    );
  }

  return null;
}
