import { NextRequest, NextResponse } from "next/server";        
import prisma from '@/lib/prisma';
import { Verifyauth} from '@/lib/authmiddleware'


export async function POST(req: NextRequest) {
  const user = await Verifyauth(req);
  if (user instanceof NextResponse) return user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      title,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
      lists: {
        create: [
          { title: "To Do" },
          { title: "In Progress" },
          { title: "Done" }
        ]
      }
    },
    include: {
      lists: true,
    }
  });

  return NextResponse.json(board);
}


export async function GET(req:NextRequest){
    const user = await Verifyauth(req);
    if (user instanceof NextResponse) {
      return user; 
    }
    const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
  });

  return NextResponse.json(boards);
}

