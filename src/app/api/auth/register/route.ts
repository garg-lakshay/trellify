import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { messsage: "User already exists" },
        { status: 400 }
      );
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    if (!hashedpassword) {
      return NextResponse.json(
        { message: "Error hashing password" },
        { status: 500 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedpassword,
      },
    });

    return NextResponse.json(
      { message: "user created sucessfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
