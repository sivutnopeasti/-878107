import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const workers = db.getUsers().sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json(workers);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nimi vaaditaan" }, { status: 400 });
  }

  const existing = db.getUserByName(name.trim());
  if (existing) {
    return NextResponse.json(
      { error: "Tämän niminen käyttäjä on jo olemassa" },
      { status: 409 }
    );
  }

  const worker = db.createUser(name.trim(), "WORKER");
  return NextResponse.json(worker, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  const success = db.deleteUser(Number(id));
  if (!success) {
    return NextResponse.json(
      { error: "Käyttäjää ei voi poistaa" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
