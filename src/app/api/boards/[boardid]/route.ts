import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function GET(req: NextRequest, context: { params: Promise<{ boardid: string }> }) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { boardid: boardId } = await context.params;
  if (!boardId) return NextResponse.json({ error: "Board ID is required" }, { status: 400 });

  const hasAccess = await hasBoardAccess(user.id, boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
          },
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ boardid: string }> }) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardid: boardId } = await context.params;
  const body = await req.json();

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: {
      title: body.title,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ boardid: string }> }) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardid: boardId } = await context.params;

  await prisma.board.delete({
    where: { id: boardId },
  });

  return NextResponse.json({ message: "Board deleted" });
}
