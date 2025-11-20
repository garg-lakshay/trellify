import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";

export async function POST(
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
  
  const params = await context.params;
  const { cardid: cardId } = params;
  const body = await req.json();
  const { toListId, newPosition } = body;

  if (!cardId || !toListId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: {
      listId: toListId,
      position: newPosition,
    },
  });

  return NextResponse.json(updatedCard);
}
