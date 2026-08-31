import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pdf-sessions
// Creates a reading session row when a PDF preview actually renders.
// Public write endpoint (works for guests too), mirroring POST /api/reviews.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await request.json();
    const { productId, totalPages, guestId } = body;

    const numericProductId = Number(productId);
    if (!numericProductId || Number.isNaN(numericProductId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const created = await prisma.pdfReadSession.create({
      data: {
        productId: numericProductId,
        userId: userId ?? null,
        guestId: userId ? null : guestId || null,
        totalPages: typeof totalPages === "number" ? totalPages : null,
      },
      select: { id: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating pdf read session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
