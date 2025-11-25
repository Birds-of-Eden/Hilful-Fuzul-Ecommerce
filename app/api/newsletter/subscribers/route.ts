//api/newsletter/subscribers

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        status: "subscribed",
      },
      orderBy: { 
        createdAt: "desc"
      },
      select: {
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: subscribers,
      count: subscribers.length
    });
  } catch (err) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load subscribers",
        message: err instanceof Error ? err.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}