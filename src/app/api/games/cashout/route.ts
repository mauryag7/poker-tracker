import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";
import { simplifyDebts } from "@/lib/simplifyDebts";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { gameId, playersData } = await req.json();

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game.hostId !== (session as any).player.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    for (const data of playersData) {
      await prisma.gamePlayer.update({
        where: { id: data.playerId },
        data: { finalChips: data.finalChips }
      });
    }

    const players = await prisma.gamePlayer.findMany({
      where: { gameId },
      include: { player: true }
    });

    // Use extracted pure function for debt simplification
    const transactions = simplifyDebts(
      players.map((p: any) => ({
        playerId: p.playerId,
        buyIns: p.buyIns,
        finalChips: p.finalChips,
        chipValue: game.chipValue,
        chipsQty: game.chipsQty,
      }))
    );

    for (const tx of transactions) {
      await prisma.ledger.create({
        data: {
          gameId,
          fromPlayerId: tx.fromPlayerId,
          toPlayerId: tx.toPlayerId,
          amount: tx.amount,
        }
      });
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { status: "completed" }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-completed', { message: 'Results are ready' });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Cashout error:", error);
    return NextResponse.json({ message: "Error in cashout" }, { status: 500 });
  }
}
