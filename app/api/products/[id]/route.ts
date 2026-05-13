//api/products/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        deleted: false,
      },
      include: {
        writer: true,
        publisher: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cleaned = {
      ...product,
      writer: product.writer?.deleted ? null : product.writer,
      publisher: product.publisher?.deleted ? null : product.publisher,
      category: product.category?.deleted ? null : product.category,
      // Back-compat aliases expected by UI/admin forms
      isPreOrder: Boolean((product as any).isPreorder),
      preOrderEndDate: (product as any).preorderEndAt ?? null,
      expectedShippingDate: (product as any).releaseDate ?? null,
      preOrderDiscount: Boolean((product as any).isPreorder)
        ? Number((product as any).discount ?? 0)
        : 0,
    };

    return NextResponse.json(cleaned);
  } catch (err) {
    console.error("GET_PRODUCT_ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const text = await req.text();

    if (!text) {
      return NextResponse.json(
        { error: "Empty Request Body" },
        { status: 400 }
      );
    }

    const body = JSON.parse(text);
    const computedDiscount = body.discount
      ? Number(body.discount)
      : body.preOrderDiscount
      ? Number(body.preOrderDiscount)
      : 0;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        deleted: false,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (body.slug && body.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: body.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,

        price: Number(body.price),
        original_price: body.original_price
          ? Number(body.original_price)
          : null,
        discount: computedDiscount,

        stock: body.stock ? Number(body.stock) : 0,
        available:
          typeof body.available === "boolean" ? body.available : true,

        writerId: body.writerId ? Number(body.writerId) : null,
        publisherId: body.publisherId ? Number(body.publisherId) : null,
        categoryId: Number(body.categoryId),

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

    return NextResponse.json({
      ...updated,
      isPreOrder: Boolean((updated as any).isPreorder),
      preOrderEndDate: (updated as any).preorderEndAt ?? null,
      expectedShippingDate: (updated as any).releaseDate ?? null,
      preOrderDiscount: Boolean((updated as any).isPreorder)
        ? Number((updated as any).discount ?? 0)
        : 0,
    });
  } catch (err) {
    console.error("UPDATE_PRODUCT_ERROR:", err);

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        deleted: false,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        deleted: true,
        available: false,
        stock: 0,
      },
    });

    return NextResponse.json({
      message: "Product soft deleted successfully",
      product: updated,
    });
  } catch (err) {
    console.error("SOFT_DELETE_PRODUCT_ERROR:", err);

    return NextResponse.json(
      { error: "Failed to deactivate product" },
      { status: 500 }
    );
  }
}
