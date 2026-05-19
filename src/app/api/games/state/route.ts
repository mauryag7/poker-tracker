import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) return NextResponse.json({ message: "No gameId" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { player: true }
        },
        ledgers: {
          include: { fromPlayer: true, toPlayer: true }
        }
      }
    });

    if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    console.error("Get game state error:", error);
    return NextResponse.json({ message: "Error fetching game state" }, { status: 500 });
  }
}
