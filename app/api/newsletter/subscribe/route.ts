import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { 
        status: "subscribed", 
        unsubscribedAt: null
      },
      create: { 
        email
      },
    });

    return NextResponse.json({ message: "Subscribed successfully!" });
  } catch (e) {
    console.error("Newsletter subscription error:", e);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
