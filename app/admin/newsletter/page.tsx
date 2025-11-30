"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import NewsletterManagement from "@/components/newsletter/NewsletterManager";
import SubscriberManagement from "@/components/newsletter/SubscriberManagement";

export default function NewsletterPage() {
  const [activeTab, setActiveTab] = useState<"newsletters" | "subscribers">("newsletters");

  const handleTabChange = useCallback((tab: "newsletters" | "subscribers") => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0] p-4 sm:p-6">
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E4B4B] to-[#086666] rounded-2xl shadow-lg p-6 mb-8 border border-[#F4F8F7]/10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F8F7] mb-2">
            Email Management
          </h1>
          <p className="text-[#F4F8F7]/70 text-sm">
            Manage newsletters and subscribers
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="bg-white/90 backdrop-blur-sm border border-[#D1D8BE] rounded-2xl shadow-lg mb-8">
          <CardContent className="p-4">
            <div className="flex space-x-1 bg-[#EEEFE0] rounded-xl p-1">
              <button
                onClick={() => handleTabChange("newsletters")}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === "newsletters"
                    ? "bg-[#0E4B4B] text-white shadow-lg"
                    : "text-[#2D4A3C] hover:bg-white/50"
                }`}
              >
                Newsletters
              </button>
              <button
                onClick={() => handleTabChange("subscribers")}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === "subscribers"
                    ? "bg-[#0E4B4B] text-white shadow-lg"
                    : "text-[#2D4A3C] hover:bg-white/50"
                }`}
              >
                Subscribers
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === "newsletters" && <NewsletterManagement />}
        {activeTab === "subscribers" && <SubscriberManagement />}
      </div>
    </div>
  );
}