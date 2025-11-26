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

    // Validate API key exists
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Resend from email not configured" },
        { status: 500 }
      );
    }

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

    const RATE_LIMIT_DELAY = 600;
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (let i = 0; i < subscribers.length; i++) {
      const { email } = subscribers[i];
      const personalizedHtml = baseHTML.replace(
        "SUBSCRIBER_EMAIL",
        encodeURIComponent(email)
      );

      try {
        // Fix: Format the from email correctly (Resend requires proper format)
        const fromEmail = process.env.RESEND_FROM_EMAIL;
        
        const response = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: newsletter.subject,
          html: personalizedHtml,
          text: newsletter.content,
        });

        // Check if Resend returned an error
        if (response.error) {
          console.error(`Resend error for ${email}:`, response.error);
          errors.push({ email, error: response.error.message || "Unknown error" });
          failureCount++;
        } else {
          successCount++;
          console.log(`Successfully sent to: ${email}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send to ${email}:`, errorMessage);
        errors.push({ email, error: errorMessage });
        failureCount++;
      }

      // Add delay between each email
      if (i < subscribers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    // Mark as sent
    await prisma.newsletter.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });

    return NextResponse.json({
      success: successCount > 0,
      message: 
        successCount === subscribers.length
          ? "Newsletter sent successfully!"
          : `Partially sent: ${successCount}/${subscribers.length} succeeded`,
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
      errors: failureCount > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Newsletter sending error:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter", details: `${error}` },
      { status: 500 }
    );
  }
}