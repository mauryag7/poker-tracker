"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Lobby() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Bug 8 fix: ALL hooks must be at the top, before any conditional returns
  const [chipValue, setChipValue] = useState("10");
  const [chipsQty, setChipsQty] = useState("100");
  const [joinCode, setJoinCode] = useState("");
  const [allowPlayerBuyins, setAllowPlayerBuyins] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.player?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // Conditional returns come AFTER all hooks
  if (status === "loading") return <p style={{ padding: 20 }}>Loading...</p>;

  if (status === "unauthenticated") {
    return (
      <div className="container" style={{ marginTop: "5vh" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <ThemeToggle />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1>Welcome to Poker Tracker</h1>
          <p style={{ marginBottom: "20px", color: "var(--text-color)" }}>The premium offline and live multiplayer poker companion.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Link href="/login"><button className="primary-btn">Sign In</button></Link>
            <Link href="/register"><button className="secondary-btn">Create Account</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && (session as any)?.player?.role === "ADMIN") {
    return <p style={{ padding: 20 }}>Redirecting to Admin Dashboard...</p>;
  }

  const handleCreate = async () => {
    setError("");
    const res = await fetch("/api/games/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chipValue, chipsQty, allowPlayerBuyins })
    });
    const data = await res.json();
    if (res.ok) router.push(`/game/${data.game.code}`);
    else setError(data.message);
  };

  const handleJoin = async () => {
    // Bug 10 fix: trim whitespace from join code before sending
    const code = joinCode.trim();
    if (!code) {
      setError("Please enter a room code.");
      return;
    }
    setError("");
    const res = await fetch("/api/games/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (res.ok) router.push(`/game/${code}`);
    else setError(data.message);
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Lobby</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ThemeToggle />
          {(session as any)?.player?.role === "ADMIN" && (
            <Link href="/admin"><button className="primary-btn" style={{ margin: 0, padding: "5px 10px", width: "auto" }}>Admin Dashboard</button></Link>
          )}
          {/* Bug 9 fix: redirect to /login after sign out */}
          <button className="secondary-btn" onClick={() => signOut({ callbackUrl: '/login' })} style={{ margin: 0, padding: "5px 10px", width: "auto" }}>Sign Out</button>
        </div>
      </header>

      <main style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ margin: 0 }}>Welcome back, <strong>{(session as any)?.player?.name}</strong></p>
          {/* Bug 13 fix: removed hardcoded #333 background, rely on CSS variable */}
          <Link href="/history"><button className="secondary-btn" style={{ margin: 0, padding: "5px 10px", width: "auto" }}>My History</button></Link>
        </div>
        
        {error && <div style={{ color: "var(--danger-color)", marginBottom: "15px", fontWeight: "bold" }}>{error}</div>}

        <div className="screen" style={{ marginBottom: "20px" }}>
          <h2>Join Live Game</h2>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="4-digit Code" style={{ flex: 1 }} />
            <button className="primary-btn" onClick={handleJoin} style={{ width: "auto" }}>Join</button>
          </div>
        </div>

        <div className="screen">
          <h2>Host New Game</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
            <div>
              <label>Chips per Buy-in:</label>
              {/* Bug 15 (minor) fix: min=1 to prevent zero/negative */}
              <input type="number" min="1" value={chipsQty} onChange={e => setChipsQty(e.target.value)} />
            </div>
            <div>
              <label>Dollars per Buy-in:</label>
              <input type="number" min="1" value={chipValue} onChange={e => setChipValue(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                id="allowPlayerBuyins" 
                checked={allowPlayerBuyins} 
                onChange={e => setAllowPlayerBuyins(e.target.checked)} 
                style={{ width: "auto", margin: 0 }} 
              />
              <label htmlFor="allowPlayerBuyins" style={{ cursor: "pointer", userSelect: "none" }}>
                Allow players to update their own buy-ins
              </label>
            </div>
            <button className="primary-btn" onClick={handleCreate}>Create Room</button>
          </div>
        </div>
      </main>
    </div>
  );
}
