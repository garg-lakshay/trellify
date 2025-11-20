import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ listid: string }> }
) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = await context.params;
  const { listid: listId } = params;
  const body = await req.json();
  const { title, description } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const hasAccess = await hasBoardAccess(user.id, list.boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
  });

  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: {
      title,
      description: description || "",
      listId,
      boardId: list.boardId,
      createdById: user.id,
      position,
    },
  });

  return NextResponse.json(card);
}
