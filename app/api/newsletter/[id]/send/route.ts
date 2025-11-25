import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function getBaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return process.env.NEXTAUTH_URL || "https://hilfulfujulbd.com/kitabghor";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { error: "Newsletter already sent" },
        { status: 400 }
      );
    }

    // GET ALL SUBSCRIBERS
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: "subscribed" },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers found" },
        { status: 404 }
      );
    }

    // Prepare static email content
    const baseHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0E4B4B, #086666); color: #F4F8F7; padding: 20px; border-radius: 10px;">
          <h1 style="margin: 0; font-size: 24px;">${newsletter.title}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">হিলফুল-ফুযুল বইয়ের দোকান - নিউজলেটার</p>
        </div>

        <div style="background: #F4F8F7; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <div style="color: #0D1414; line-height: 1.6; white-space: pre-wrap;">${newsletter.content}</div>
        </div>

        <div style="background: #0E4B4B; color: #F4F8F7; padding: 15px; border-radius: 10px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px;">হিলফুল-ফুযুল বইয়ের দোকান</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">এই ইমেইলটি আপনার সাবস্ক্রিপশনের কারণে পাঠানো হয়েছে</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
            <a href="${getBaseUrl()}/api/newsletter/unsubscribe?email=SUBSCRIBER_EMAIL"
               style="color: #F4F8F7; text-decoration: underline;">
              সাবস্ক্রিপশন বাতিল করুন
            </a>
          </p>
        </div>
      </div>
    `;

    // ========= SEND INDIVIDUAL EMAILS =========
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 800; // milliseconds
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async ({ email }) => {
          const personalizedHtml = baseHTML.replace(
            "SUBSCRIBER_EMAIL",
            encodeURIComponent(email)
          );

          try {
            await resend.emails.send({
              from: `${process.env.RESEND_FROM_EMAIL}`,
              to: email,
              subject: newsletter.subject,
              html: personalizedHtml,
              text: newsletter.content,
            });

            successCount++;
          } catch (error) {
            console.error("Failed:", email, error);
            failureCount++;
          }
        })
      );

      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    // Mark Sent
    await prisma.newsletter.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Newsletter sent successfully!",
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("Newsletter sending error:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter", details: `${error}` },
      { status: 500 }
    );
  }
}
