import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/pdf-reports?page=1&limit=20&productId=&readerType=all|user|guest&from=&to=
// Admin-only: exposes per-user PDF reading behavior.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;
    const productIdParam = searchParams.get("productId");
    const readerType = searchParams.get("readerType");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const downloadedOnly = searchParams.get("downloadedOnly") === "true";

    const where: any = {};
    if (productIdParam) where.productId = Number(productIdParam);
    if (readerType === "user") where.userId = { not: null };
    if (readerType === "guest") where.userId = null;
    if (downloadedOnly) where.downloaded = true;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [sessions, total, grouped] = await Promise.all([
      prisma.pdfReadSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.pdfReadSession.count({ where }),
      prisma.pdfReadSession.groupBy({
        by: ["productId"],
        where,
        _count: { _all: true },
        _avg: { durationSec: true, maxPage: true },
      }),
    ]);

    const productIds = grouped.map((g) => g.productId);

    const [products, downloadCounts, distinctRows] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      }),
      prisma.pdfReadSession.groupBy({
        by: ["productId"],
        where: { ...where, downloaded: true },
        _count: { _all: true },
      }),
      prisma.pdfReadSession.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, userId: true, guestId: true },
      }),
    ]);

    const uniqueReadersByProduct = new Map<number, Set<string>>();
    for (const row of distinctRows) {
      const key = row.userId || row.guestId || "unknown";
      if (!uniqueReadersByProduct.has(row.productId)) {
        uniqueReadersByProduct.set(row.productId, new Set());
      }
      uniqueReadersByProduct.get(row.productId)!.add(key);
    }

    const productNameById = new Map(products.map((p) => [p.id, p.name]));
    const downloadCountByProduct = new Map(
      downloadCounts.map((d) => [d.productId, d._count._all]),
    );

    const summary = grouped.map((g) => ({
      productId: g.productId,
      productName: productNameById.get(g.productId) ?? "",
      uniqueReaders: uniqueReadersByProduct.get(g.productId)?.size ?? 0,
      totalSessions: g._count._all,
      avgDurationSec: g._avg.durationSec ?? 0,
      avgMaxPage: g._avg.maxPage ?? 0,
      downloadCount: downloadCountByProduct.get(g.productId) ?? 0,
    }));

    return NextResponse.json({
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary,
    });
  } catch (error) {
    console.error("Error fetching pdf reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
