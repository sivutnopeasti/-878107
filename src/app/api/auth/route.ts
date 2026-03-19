import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nimi vaaditaan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { name: name.trim() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Käyttäjää ei löydy. Pyydä adminia lisäämään profiilisi." },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
