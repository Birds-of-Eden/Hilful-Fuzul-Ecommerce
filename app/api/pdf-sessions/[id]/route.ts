import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/pdf-sessions/[id]
// Body may include any of: { maxPage?: number, ended?: boolean, downloaded?: boolean,
//   downloaderName?: string, downloaderPhone?: string, downloaderEmail?: string }
// Used both to end a reading session (computes durationSec server-side)
// and to record a download (with the downloader's contact info) on the same session row.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = Number(id);
    if (!sessionId || Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const data: any = {};

    if (typeof body.maxPage === "number") {
      data.maxPage = body.maxPage;
    }

    if (body.ended === true) {
      const existing = await prisma.pdfReadSession.findUnique({
        where: { id: sessionId },
        select: { startedAt: true },
      });
      if (existing) {
        const endedAt = new Date();
        data.endedAt = endedAt;
        data.durationSec = Math.max(
          0,
          Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000)
        );
      }
    }

    if (body.downloaded === true) {
      data.downloaded = true;
      data.downloadedAt = new Date();
      if (typeof body.downloaderName === "string") {
        data.downloaderName = body.downloaderName.trim().slice(0, 200);
      }
      if (typeof body.downloaderPhone === "string") {
        data.downloaderPhone = body.downloaderPhone.trim().slice(0, 50);
      }
      if (typeof body.downloaderEmail === "string") {
        data.downloaderEmail = body.downloaderEmail.trim().slice(0, 200);
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const updated = await prisma.pdfReadSession.update({
      where: { id: sessionId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating pdf read session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
