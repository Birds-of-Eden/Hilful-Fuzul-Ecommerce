import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Email not found in subscription list" }, { status: 404 });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { 
        status: "unsubscribed", 
        unsubscribedAt: new Date() 
      },
    });

    return NextResponse.json({ message: "You have been unsubscribed!" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
