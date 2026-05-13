"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE]/30 p-6">
        <div >
          <div className="h-96 bg-white/80 rounded-2xl shadow-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE]/30 p-6">
      <div>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-2 h-10 bg-gradient-to-b from-[#2C4A3B] to-[#819A91] rounded-full"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2C4A3B] to-[#819A91] bg-clip-text text-transparent">
              সাইট সেটিংস
            </h1>
            <div className="w-2 h-10 bg-gradient-to-b from-[#819A91] to-[#2C4A3B] rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            আপনার ওয়েবসাইটের সকল সেটিংস এখান থেকে নিয়ন্ত্রণ করুন
          </p>
        </div>

        <Card className="bg-white/80 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#0E4B4B]" />
              সাইট কনফিগারেশন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SiteSettingsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}