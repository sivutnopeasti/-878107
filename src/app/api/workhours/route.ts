import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const contractId = searchParams.get("contractId");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = Number(userId);
  if (contractId) where.contractId = Number(contractId);

  const workHours = await prisma.workHour.findMany({
    where,
    include: {
      user: true,
      contract: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(workHours);
}

export async function POST(request: NextRequest) {
  const { userId, contractId, hours, date, description } =
    await request.json();

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

  const workHour = await prisma.workHour.create({
    data: {
      userId: Number(userId),
      contractId: Number(contractId),
      hours: Number(hours),
      date,
      description: description?.trim() || "",
    },
    include: {
      user: true,
      contract: true,
    },
  });

  return NextResponse.json(workHour, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  await prisma.workHour.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
