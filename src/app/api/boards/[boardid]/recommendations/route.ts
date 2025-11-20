import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { hasBoardAccess } from "@/lib/boardAccess";
import { generateRecommendations } from "@/lib/recommendations";

export async function GET(
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
  
  const { boardid: boardId } = await context.params;
  
  const hasAccess = await hasBoardAccess(user.id, boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  let recs = await prisma.recommendation.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
  });

  if (recs.length === 0) {
    try {
      await generateRecommendations(boardId);
      recs = await prisma.recommendation.findMany({
        where: { boardId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Error genrating recomendations:", error);
    }
  }

  return NextResponse.json(recs);
}

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
  
  const { boardid: boardId } = await context.params;
  
  const hasAccess = await hasBoardAccess(user.id, boardId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You dont have access to this board" }, { status: 403 });
  }

  try {
    await generateRecommendations(boardId);
    const recs = await prisma.recommendation.findMany({
      where: { boardId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ message: "Recomendations refreshed", recommendations: recs });
  } catch (error) {
    console.error("Error genrating recomendations:", error);
    return NextResponse.json(
      { error: "Failed to genrate recomendations" },
      { status: 500 }
    );
  }
}
