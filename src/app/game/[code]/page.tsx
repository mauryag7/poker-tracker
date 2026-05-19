import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import GameClient from "./GameClient";
import { redirect } from "next/navigation";

export default async function GamePage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).player) {
    redirect("/login");
  }

  const game = await prisma.game.findUnique({
    where: { code: params.code },
    include: {
      players: {
        include: { player: true }
      },
      ledgers: {
        include: { fromPlayer: true, toPlayer: true }
      }
    }
  });

  if (!game) {
    return <div className="container"><h1>Game not found</h1></div>;
  }

  return <GameClient initialGame={game} playerId={(session as any).player.id} isAdmin={(session as any).player.role === "ADMIN"} />;
}
