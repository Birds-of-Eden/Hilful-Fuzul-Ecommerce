import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the last viewed timestamp from a simple file-based storage
    // In a production app, you'd store this in the database
    const fs = require('fs').promises;
    const path = require('path');
    
    let lastViewedTime = new Date(0); // Default to epoch time
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      const lastViewedFile = path.join(dataDir, 'last-viewed-orders.json');
      const fileContent = await fs.readFile(lastViewedFile, 'utf-8');
      const parsed = JSON.parse(fileContent);
      lastViewedTime = new Date(parsed.lastViewed);
    } catch (error) {
      // File doesn't exist or is invalid, use default
    }
    
    // Count orders created after the last viewed time
    const newOrdersCount = await db.order.count({
      where: {
        createdAt: {
          gt: lastViewedTime,
        },
      },
    });

    return NextResponse.json({ count: newOrdersCount });
  } catch (error) {
    console.error("Error fetching new orders count:", error);
    return NextResponse.json(
      { error: "Failed to fetch new orders count" },
      { status: 500 }
    );
  }
}
