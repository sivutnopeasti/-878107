import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const contracts = db.getContractsWithHours();
  return NextResponse.json(contracts);
}

export async function POST(request: NextRequest) {
  const { name, description } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Urakan nimi vaaditaan" },
      { status: 400 }
    );
  }

  const contract = db.createContract(name.trim(), description?.trim() || "");
  return NextResponse.json(contract, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, name, description, value, status } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim();
  if (value !== undefined) updates.value = value === null ? null : Number(value);
  if (status !== undefined) updates.status = status;

  const contract = db.updateContract(Number(id), updates);
  if (!contract) {
    return NextResponse.json({ error: "Urakkaa ei löydy" }, { status: 404 });
  }

  return NextResponse.json(contract);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  db.deleteContract(Number(id));
  return NextResponse.json({ success: true });
}
