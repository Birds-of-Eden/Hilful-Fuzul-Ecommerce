import { NextRequest, NextResponse } from "next/server";

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Recipient emails
const RECIPIENT_EMAILS = [
  "islamidawainstitute@gmail.com",
  "service@birdsofeden.me",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে সকল ঘর পূরণ করুন" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন" },
        { status: 400 }
      );
    }

    // Create email content
    const emailContent = {
      subject: `নতুন যোগাযোগ মেসেজ: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0E4B4B, #086666); color: #F4F8F7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">হিলফুল-ফুযুল বইয়ের দোকান</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">নতুন যোগাযোগ মেসেজ</p>
          </div>
          
          <div style="background: #F4F8F7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #0D1414; margin-top: 0;">মেসেজের বিবরণ</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #0E4B4B; width: 100px;">নাম:</td>
                <td style="padding: 8px; color: #0D1414;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #0E4B4B;">ইমেইল:</td>
                <td style="padding: 8px; color: #0D1414;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #0E4B4B;">বিষয়:</td>
                <td style="padding: 8px; color: #0D1414;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #0E4B4B; vertical-align: top;">মেসেজ:</td>
                <td style="padding: 8px; color: #0D1414; white-space: pre-wrap;">${message}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #0E4B4B; color: #F4F8F7; padding: 15px; border-radius: 10px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">এই মেসেজটি হিলফুল-ফুযুল বইয়ের দোকান ওয়েবসাইট থেকে পাঠানো হয়েছে</p>
            <p style="margin: 5px 0 0 0;">সময়: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}</p>
          </div>
        </div>
      `,
      text: `
নাম: ${name}
ইমেইল: ${email}
বিষয়: ${subject}

মেসেজ:
${message}

---
এই মেসেজটি হিলফুল-ফুযুল বইয়ের দোকান ওয়েবসাইট থেকে পাঠানো হয়েছে।
সময়: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}
      `,
    };
    const emailResult = await sendEmailWithResend(emailContent, email);

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "মেসেজ সফলভাবে পাঠানো হয়েছে!",
      });
    } else {
      throw new Error(emailResult.error || "মেসেজ পাঠাতে সমস্যা হয়েছে");
    }
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "মেসেজ পাঠাতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন",
      },
      { status: 500 }
    );
  }
}

// Resend email service
async function sendEmailWithResend(emailContent: any, replyTo: string) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: RECIPIENT_EMAILS,
        subject: emailContent.subject,
        html: emailContent.html,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API Error Response:", error);
      throw new Error(error.message || "Unknown Resend failure");
    }

    return { success: true };
  } catch (error) {
    console.error("Resend sending failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Resend error",
    };
  }
}
