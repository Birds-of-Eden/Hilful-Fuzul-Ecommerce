import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Save the current timestamp as the last viewed time
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const lastViewedFile = path.join(dataDir, 'last-viewed-orders.json');
    
    const lastViewedData = {
      lastViewed: new Date().toISOString(),
      viewedBy: (session.user as any).id,
    };
    
    await fs.writeFile(lastViewedFile, JSON.stringify(lastViewedData, null, 2));
    
    return NextResponse.json({ success: true, lastViewed: lastViewedData.lastViewed });
  } catch (error) {
    console.error("Error marking orders as viewed:", error);
    return NextResponse.json(
      { error: "Failed to mark orders as viewed" },
      { status: 500 }
    );
  }
}
