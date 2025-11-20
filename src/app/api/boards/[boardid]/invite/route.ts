import prisma from "@/lib/prisma";
import { Verifyauth } from "@/lib/authmiddleware";
import { NextResponse, NextRequest } from "next/server";
import { sendBoardInvite } from "@/lib/email";

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
  const { email } = body;

  if (!email || email.trim() === "") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const isOwner = board.ownerId === user.id;
  const isMember = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId: user.id,
    },
  });

  if (!isOwner && !isMember) {
    return NextResponse.json(
      { error: "You dont have permission to invite users to this board" },
      { status: 403 }
    );
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!invitedUser) {
    return NextResponse.json(
      { error: "User with this email does not exist. They need to sign up first." },
      { status: 404 }
    );
  }

  const alreadyMember = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId: invitedUser.id,
    },
  });

  if (alreadyMember) {
    return NextResponse.json(
      { error: "User is already a member of this board" },
      { status: 400 }
    );
  }

  await prisma.boardMember.create({
    data: {
      boardId,
      userId: invitedUser.id,
      role: "member",
    },
  });

  try {
    await sendBoardInvite(
      email,
      board.title,
      boardId,
      user.name || user.email
    );
  } catch (error) {
    console.error("Failed to send email, but user was added:", error);
  }

  return NextResponse.json({
    message: "User added to board and invitation email sent",
    userId: invitedUser.id,
  });
}
