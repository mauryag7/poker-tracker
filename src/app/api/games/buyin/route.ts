import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { gameId, playerId, action } = await req.json();

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game.status !== "active") return NextResponse.json({ message: "Invalid game" }, { status: 400 });

    const requesterId = (session as any).player.id;
    const isHost = game.hostId === requesterId;

    const player = await prisma.gamePlayer.findUnique({
      where: { id: playerId }
    });

    if (!player) return NextResponse.json({ message: "Player not found" }, { status: 404 });

    if (!isHost) {
      if (!game.allowPlayerBuyins) {
        return NextResponse.json({ message: "Forbidden: Only the host can modify buy-ins in this game" }, { status: 403 });
      }
      if (player.playerId !== requesterId) {
        return NextResponse.json({ message: "Forbidden: You can only modify your own buy-ins" }, { status: 403 });
      }
    }

    const newBuyIns = action === 'add' ? player.buyIns + 1 : Math.max(1, player.buyIns - 1);

    await prisma.gamePlayer.update({
      where: { id: playerId },
      data: { buyIns: newBuyIns }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-updated', { message: 'Buy-in updated' });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Buy-in update error:", error);
    return NextResponse.json({ message: "Error updating buy-in" }, { status: 500 });
  }
}
