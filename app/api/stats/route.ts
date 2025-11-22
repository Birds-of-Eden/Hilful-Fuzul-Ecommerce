import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Total Books
    const totalBooks = await prisma.product.count();

    // Total Writers
    const totalWriters = await prisma.writer.count();

    // Total Delivered Orders
    const totalDelivered = await prisma.order.count({
      where: {
        status: "DELIVERED",
      },
    });

    return NextResponse.json({
      totalBooks,
      totalWriters,
      totalDelivered,
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
