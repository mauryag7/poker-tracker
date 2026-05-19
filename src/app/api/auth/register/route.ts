import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const existingPlayer = await prisma.player.findUnique({
      where: { email }
    });

    if (existingPlayer) {
      return NextResponse.json({ message: "Player already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const player = await prisma.player.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    return NextResponse.json({ player: { id: player.id, name: player.name, email: player.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
