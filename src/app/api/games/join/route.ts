import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if ((session as any).player.role === "ADMIN") {
      return NextResponse.json({ message: "Admins cannot join games" }, { status: 403 });
    }

    const game = await prisma.game.findUnique({
      where: { code }
    });

    if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });
    if (game.status !== "active") return NextResponse.json({ message: "Game is not active" }, { status: 400 });

    const existingPlayer = await prisma.gamePlayer.findUnique({
      where: {
        playerId_gameId: {
          playerId: (session as any).player.id,
          gameId: game.id
        }
      }
    });

    if (!existingPlayer) {
      await prisma.gamePlayer.create({
        data: {
          playerId: (session as any).player.id,
          gameId: game.id,
          buyIns: 1
        }
      });
      
      await pusherServer.trigger(`game-${game.id}`, 'game-updated', { message: 'New player joined' });
    }

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    console.error("Join game error:", error);
    return NextResponse.json({ message: "Error joining game" }, { status: 500 });
  }
}
