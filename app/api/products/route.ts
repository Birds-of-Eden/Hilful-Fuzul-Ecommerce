import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        deleted: false,
      },
      orderBy: { id: "desc" },
      include: {
        writer: true,
        publisher: true,
        category: true,
      },
    });

    const cleaned = products
      .map((p: any) => ({
        ...p,
        writer: p.writer?.deleted ? null : p.writer,
        publisher: p.publisher?.deleted ? null : p.publisher,
        category: p.category?.deleted ? null : p.category,
        // Back-compat aliases expected by UI/admin forms
        isPreOrder: Boolean(p.isPreorder),
        preOrderEndDate: p.preorderEndAt ?? null,
        expectedShippingDate: p.releaseDate ?? null,
        preOrderDiscount: Boolean(p.isPreorder) ? Number(p.discount ?? 0) : 0,
      }))
      .filter(
        (p: any) =>
          p.writer !== null &&
          p.publisher !== null &&
          p.category !== null
      );

    return NextResponse.json(cleaned);
  } catch (err) {
    console.error("PRODUCTS_GET_ERROR", err);

    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.slug || !body.description || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    const exists = await prisma.product.findUnique({
      where: { slug: body.slug },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const writerId = body.writerId ? Number(body.writerId) : null;
    const publisherId = body.publisherId ? Number(body.publisherId) : null;
    const categoryId = Number(body.categoryId);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,

        price: Number(body.price),
        original_price: body.original_price
          ? Number(body.original_price)
          : null,
        discount: body.discount
          ? Number(body.discount)
          : body.preOrderDiscount
          ? Number(body.preOrderDiscount)
          : 0,

        stock: body.stock ? Number(body.stock) : 0,
        available:
          typeof body.available === "boolean" ? body.available : true,

        writerId,
        publisherId,
        categoryId,

        image: body.image || null,
        gallery: Array.isArray(body.gallery) ? body.gallery : [],
        pdf: body.pdf || null,

        // Preorder (Prisma field names)
        isPreorder: Boolean(body.isPreOrder ?? body.isPreorder),
        preorderEndAt: body.preOrderEndDate
          ? new Date(body.preOrderEndDate)
          : body.preorderEndAt
          ? new Date(body.preorderEndAt)
          : null,
        releaseDate: body.expectedShippingDate
          ? new Date(body.expectedShippingDate)
          : body.releaseDate
          ? new Date(body.releaseDate)
          : null,
      },
      include: {
        writer: true,
        publisher: true,
        category: true,
      },
    });

    return NextResponse.json(
      {
        ...product,
        isPreOrder: Boolean(product.isPreorder),
        preOrderEndDate: product.preorderEndAt ?? null,
        expectedShippingDate: product.releaseDate ?? null,
        preOrderDiscount: Boolean(product.isPreorder)
          ? Number(product.discount ?? 0)
          : 0,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("PRODUCTS_POST_ERROR", err);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
