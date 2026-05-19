import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).player) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { chipValue, chipsQty, allowPlayerBuyins } = await req.json();

    if ((session as any).player.role === "ADMIN") {
      return NextResponse.json({ message: "Admins cannot create games" }, { status: 403 });
    }

    // Bug 15 fix: validate inputs server-side
    if (parseFloat(chipValue) <= 0 || parseInt(chipsQty) <= 0) {
      return NextResponse.json({ message: "Chip values must be greater than zero" }, { status: 400 });
    }

    // Bug 5 fix: retry until a unique code is found (avoids collision silent failures)
    let code: string;
    let attempts = 0;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await prisma.game.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json({ message: "Could not generate a unique room code. Please try again." }, { status: 500 });
    }

    const game = await prisma.game.create({
      data: {
        code,
        chipValue: parseFloat(chipValue),
        chipsQty: parseInt(chipsQty),
        allowPlayerBuyins: !!allowPlayerBuyins,
        hostId: (session as any).player.id,
      }
    });

    await prisma.gamePlayer.create({
      data: {
        playerId: (session as any).player.id,
        gameId: game.id,
        buyIns: 1
      }
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    console.error("Game creation error:", error);
    return NextResponse.json({ message: "Error creating game" }, { status: 500 });
  }
}
