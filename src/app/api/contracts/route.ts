import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const contracts = await prisma.contract.findMany({
    include: {
      workHours: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
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

  const contract = await prisma.contract.create({
    data: {
      name: name.trim(),
      description: description?.trim() || "",
    },
  });

  return NextResponse.json(contract, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, name, description, value, status } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description.trim();
  if (value !== undefined) data.value = value === null ? null : Number(value);
  if (status !== undefined) data.status = status;

  const contract = await prisma.contract.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(contract);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID vaaditaan" }, { status: 400 });
  }

  await prisma.contract.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
