import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const contractId = searchParams.get("contractId");

  const filters: { userId?: number; contractId?: number } = {};
  if (userId) filters.userId = Number(userId);
  if (contractId) filters.contractId = Number(contractId);

  const workHours = db.getWorkHours(filters);
  return NextResponse.json(workHours);
}

export async function POST(request: NextRequest) {
  const { userId, contractId, hours, date, description } = await request.json();

  if (!userId || !contractId || !hours || !date) {
    return NextResponse.json(
      { error: "Kaikki kentät vaaditaan (userId, contractId, hours, date)" },
      { status: 400 }
    );
  }

  if (Number(hours) <= 0) {
    return NextResponse.json(
      { error: "Tuntimäärän täytyy olla positiivinen" },
      { status: 400 }
    );
  }

  const workHour = db.createWorkHour(
    Number(userId),
    Number(contractId),
    Number(hours),
    date,
    description?.trim() || ""
  );

  if (!workHour) {
    return NextResponse.json(
      { error: "Käyttäjää tai urakkaa ei löydy" },
      { status: 404 }
    );
  }

  return NextResponse.json(workHour, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  db.deleteWorkHour(Number(id));
  return NextResponse.json({ success: true });
}
