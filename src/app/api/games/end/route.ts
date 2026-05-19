import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { gameId } = await req.json();

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    
    if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });
    if (game.hostId !== (session as any).player.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await prisma.game.update({
      where: { id: gameId },
      data: { status: "cashout" }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-ended', { message: 'Host ended game' });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("End game error:", error);
    return NextResponse.json({ message: "Error ending game" }, { status: 500 });
  }
}
