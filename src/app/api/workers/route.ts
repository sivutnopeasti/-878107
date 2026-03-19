import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const workers = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workers);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nimi vaaditaan" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Tämän niminen käyttäjä on jo olemassa" },
      { status: 409 }
    );
  }

  const worker = await prisma.user.create({
    data: { name: name.trim(), role: "WORKER" },
  });

  return NextResponse.json(worker, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) {
    return NextResponse.json(
      { error: "Käyttäjää ei löydy" },
      { status: 404 }
    );
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin-käyttäjää ei voi poistaa" },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
