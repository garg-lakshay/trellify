import prisma from "@/lib/prisma";

export async function hasBoardAccess(userId: string, boardId: string): Promise<boolean> {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!board) {
      return false;
    }

    if (board.ownerId === userId) {
      return true;
    }

    if (board.members && board.members.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.log("Error checking board access:", error);
    return false;
  }
}
