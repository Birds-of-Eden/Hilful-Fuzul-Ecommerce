// app/api/sitemanagement/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      return NextResponse.json({
        id: "main",
        siteName: "",
        siteTitle: "",
        tagline: "",
        footerTagline: "",
        description: "",

        logo: null,
        topBarText: "",

        phone: "",
        email: "",
        address: "",

        facebookUrl: "",
        instagramUrl: "",
        twitterUrl: "",

        preorderPopupEnabled: false,
        preorderPopupTitle: "",
        preorderPopupText: "",
        preorderPopupImage: null,
        preorderButtonText: "প্রি-অর্ডার করুন",
        preorderLink: "",
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);

    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updatedSettings = await prisma.siteSetting.upsert({
      where: {
        id: "main",
      },

      update: {
        siteName: body.siteName || "",
        siteTitle: body.siteTitle || "",
        tagline: body.tagline || "",
        footerTagline: body.footerTagline || "",
        description: body.description || "",

        logo: body.logo || null,
        topBarText: body.topBarText || "",

        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,

        facebookUrl: body.facebookUrl || null,
        instagramUrl: body.instagramUrl || null,
        twitterUrl: body.twitterUrl || null,

        preorderPopupEnabled: Boolean(body.preorderPopupEnabled),

        preorderPopupTitle: body.preorderPopupTitle || null,

        preorderPopupText: body.preorderPopupText || null,

        preorderPopupImage: body.preorderPopupImage || null,

        preorderButtonText:
          body.preorderButtonText?.trim() || "প্রি-অর্ডার করুন",

        preorderLink: body.preorderLink?.trim() || null,
      },

      create: {
        id: "main",

        siteName: body.siteName || "",
        siteTitle: body.siteTitle || "",
        tagline: body.tagline || "",
        footerTagline: body.footerTagline || "",
        description: body.description || "",

        logo: body.logo || null,
        topBarText: body.topBarText || "",

        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,

        facebookUrl: body.facebookUrl || null,
        instagramUrl: body.instagramUrl || null,
        twitterUrl: body.twitterUrl || null,

        preorderPopupEnabled: Boolean(body.preorderPopupEnabled),

        preorderPopupTitle: body.preorderPopupTitle || null,

        preorderPopupText: body.preorderPopupText || null,

        preorderPopupImage: body.preorderPopupImage || null,

        preorderButtonText:
          body.preorderButtonText?.trim() || "প্রি-অর্ডার করুন",

        preorderLink: body.preorderLink?.trim() || null,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating site settings:", error);

    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 },
    );
  }
}
