"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface SiteSettings {
  id: string;
  siteName: string;
  siteTitle: string;
  tagline: string;
  footerTagline: string;
  description: string;
  logo: string | null;
  topBarText: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  preorderPopupEnabled: boolean;
  preorderPopupTitle: string | null;
  preorderPopupText: string | null;
  preorderPopupImage: string | null;
  preorderButtonText: string | null;
  preorderLink: string | null;
}

export default function SiteSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/sitemanagement");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("সেটিংস লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/settings", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    try {
      const url = await handleImageUpload(e.target.files[0]);
      setSettings((prev) => (prev ? { ...prev, logo: url } : null));
      toast.success("লোগো আপলোড হয়েছে");
    } catch (error) {
      toast.error("লোগো আপলোড করতে ব্যর্থ হয়েছে");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePreorderImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    try {
      const url = await handleImageUpload(e.target.files[0]);
      setSettings((prev) =>
        prev ? { ...prev, preorderPopupImage: url } : null,
      );
      toast.success("প্রি-অর্ডার ইমেজ আপলোড হয়েছে");
    } catch (error) {
      toast.error("ইমেজ আপলোড করতে ব্যর্থ হয়েছে");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/sitemanagement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="general">সাধারণ</TabsTrigger>
          <TabsTrigger value="contact">যোগাযোগ</TabsTrigger>
          <TabsTrigger value="social">সোশ্যাল মিডিয়া</TabsTrigger>
          <TabsTrigger value="preorder">প্রি-অর্ডার</TabsTrigger>
          <TabsTrigger value="seo" className="hidden lg:block">
            SEO
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>সাইটের সাধারণ তথ্য</CardTitle>
              <CardDescription>
                আপনার সাইটের মৌলিক তথ্য সেট করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>সাইটের নাম (Site Name)</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings({ ...settings, siteName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>সাইট টাইটেল (Site Title)</Label>
                <Input
                  value={settings.siteTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, siteTitle: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ট্যাগলাইন (Tagline)</Label>
                <Input
                  value={settings.tagline}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ফুটার ট্যাগলাইন (Footer Tagline)</Label>
                <Input
                  value={settings.footerTagline}
                  onChange={(e) =>
                    setSettings({ ...settings, footerTagline: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>সাইটের বিবরণ (Description)</Label>
                <Textarea
                  value={settings.description}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>টপ বার টেক্সট (Top Bar Text)</Label>
                <Input
                  value={settings.topBarText}
                  onChange={(e) =>
                    setSettings({ ...settings, topBarText: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  হেডারের উপরের বারটিতে দেখানো হবে
                </p>
              </div>

              <div>
                <Label>লোগো (Logo)</Label>
                <div className="mt-2">
                  {settings.logo ? (
                    <div className="relative inline-block">
                      <Image
                        src={settings.logo}
                        alt="Logo"
                        width={100}
                        height={100}
                        className="rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logo: null })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#0E4B4B]">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">
                        আপলোড করুন
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                  {uploadingImage && (
                    <p className="text-sm text-gray-500 mt-1">আপলোড হচ্ছে...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>যোগাযোগের তথ্য</CardTitle>
              <CardDescription>ফোন, ইমেইল এবং ঠিকানা সেট করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ফোন নম্বর</Label>
                <Input
                  value={settings.phone || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  placeholder="+880-XXXXXXXXX"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ইমেইল ঠিকানা</Label>
                <Input
                  value={settings.email || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  placeholder="info@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ঠিকানা</Label>
                <Textarea
                  value={settings.address || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  rows={3}
                  placeholder="গ্রীন রোড, ঢাকা-১২১৫&#10;বাংলাদেশ"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>সোশ্যাল মিডিয়া লিংক</CardTitle>
              <CardDescription>
                আপনার সোশ্যাল মিডিয়া প্রোফাইল লিংক দিন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={settings.facebookUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, facebookUrl: e.target.value })
                  }
                  placeholder="https://facebook.com/yourpage"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={settings.instagramUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, instagramUrl: e.target.value })
                  }
                  placeholder="https://instagram.com/yourprofile"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Twitter/X URL</Label>
                <Input
                  value={settings.twitterUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, twitterUrl: e.target.value })
                  }
                  placeholder="https://twitter.com/yourprofile"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preorder Settings */}
        <TabsContent value="preorder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>প্রি-অর্ডার পপআপ সেটিংস</CardTitle>
              <CardDescription>প্রি-অর্ডার পপআপ কাস্টমাইজ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>প্রি-অর্ডার পপআপ সক্রিয় করুন</Label>
                  <p className="text-sm text-gray-500">
                    হোমপেজে প্রি-অর্ডার পপআপ দেখাবে
                  </p>
                </div>
                <Switch
                  checked={settings.preorderPopupEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, preorderPopupEnabled: checked })
                  }
                />
              </div>

              <div>
                <Label>পপআপ টাইটেল</Label>
                <Input
                  value={settings.preorderPopupTitle || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preorderPopupTitle: e.target.value,
                    })
                  }
                  placeholder="প্রি-অর্ডার করুন"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>পপআপ টেক্সট</Label>
                <Textarea
                  value={settings.preorderPopupText || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preorderPopupText: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="নতুন বই প্রি-অর্ডার করুন এবং স্পেশাল ডিসকাউন্ট পান!"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>পপআপ ইমেজ</Label>
                <div className="mt-2">
                  {settings.preorderPopupImage ? (
                    <div className="relative inline-block">
                      <Image
                        src={settings.preorderPopupImage}
                        alt="Preorder"
                        width={150}
                        height={150}
                        className="rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, preorderPopupImage: null })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#0E4B4B]">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">
                        ইমেজ আপলোড
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePreorderImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>বাটনের টেক্সট</Label>
                <Input
                  value={settings.preorderButtonText || "প্রি-অর্ডার করুন"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preorderButtonText: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>প্রি-অর্ডার লিংক</Label>
                <Input
                  value={
                    settings.preorderLink ||
                    "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform"
                  }
                  onChange={(e) =>
                    setSettings({ ...settings, preorderLink: e.target.value })
                  }
                  placeholder="https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={fetchSettings}>
          রিফ্রেশ
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#0E4B4B] hover:bg-[#086666]"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
        </Button>
      </div>
    </form>
  );
}
