import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ boardid: string }> }
) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) {
    return user;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const params = await context.params;
  const { boardid: boardId } = params;
  const body = await req.json();
  const { title } = body;

  if (!title || title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const hasAccess = await hasBoardAccess(user.id, boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  const lastList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });

  const position = lastList ? lastList.position + 1 : 0;

  const list = await prisma.list.create({
    data: {
      title,
      boardId,
      position,
    },
  });

  return NextResponse.json(list);
}
