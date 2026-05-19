import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { gameId, playerId } = await req.json();

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game.hostId !== (session as any).player.id) {
      return NextResponse.json({ message: "Forbidden: Only host can kick players" }, { status: 403 });
    }

    const playerToKick = await prisma.gamePlayer.findUnique({ where: { id: playerId } });
    if (!playerToKick) return NextResponse.json({ message: "Player not found" }, { status: 404 });
    
    if (playerToKick.playerId === (session as any).player.id) {
      return NextResponse.json({ message: "Host cannot kick themselves" }, { status: 400 });
    }

    await prisma.gamePlayer.delete({
      where: { id: playerId }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-updated', { message: 'Player kicked' });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Kick player error:", error);
    return NextResponse.json({ message: "Error kicking player" }, { status: 500 });
  }
}
