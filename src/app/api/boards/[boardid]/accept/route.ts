import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";

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

  const existingMember = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId: user.id,
    },
  });

  if (existingMember) {
    return NextResponse.json({ message: "Already a member of this board" });
  }

  await prisma.boardMember.create({
    data: {
      boardId,
      userId: user.id,
      role: "member",
    },
  });

  return NextResponse.json({ message: "Joined the board" });
}
