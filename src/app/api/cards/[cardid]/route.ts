import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ cardid: string }> }
) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardid: cardId } = await context.params;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: true,
      board: true,
      createdBy: true,
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const hasAccess = await hasBoardAccess(user.id, card.boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  return NextResponse.json(card);
}


export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ cardid: string }> }
) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cardid: cardId } = await context.params;
  const body = await req.json();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const hasAccess = await hasBoardAccess(user.id, card.boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  return NextResponse.json(updated);
}


export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ cardid: string }> }
) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardid: cardId } = await context.params;

  await prisma.card.delete({
    where: { id: cardId },
  });

  return NextResponse.json({ message: "Card deleted" });
}
