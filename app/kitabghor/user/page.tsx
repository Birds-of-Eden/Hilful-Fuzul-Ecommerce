// app/kitabghor/user/page.tsx
"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  image: string | null;
  note: string | null;
  address: any | null;
}

export default function UserProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");
  const [note, setNote] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          throw new Error("প্রোফাইল লোড করতে সমস্যা হয়েছে");
        }
        const data: ProfileData = await res.json();
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setImage(data.image ?? "");
        setNote(data.note ?? "");

        if (data.address) {
          if (Array.isArray(data.address)) {
            const formattedAddresses = data.address
              .map((a: any) => {
                if (typeof a === "string") return a;
                const parts = [];
                if (a.label) parts.push(a.label);
                if (a.line1) parts.push(a.line1);
                if (a.line2) parts.push(a.line2);
                return parts.join(", ");
              })
              .filter((a: string) => a.trim() !== "");
            setAddresses(
              formattedAddresses.length > 0 ? formattedAddresses : [""]
            );
          } else if (typeof data.address === "object") {
            const addr = data.address as any;
            if (addr.addresses && Array.isArray(addr.addresses)) {
              setAddresses(
                addr.addresses.length > 0 ? [...addr.addresses, ""] : [""]
              );
            } else {
              const parts = [];
              if (addr.label) parts.push(addr.label);
              if (addr.line1) parts.push(addr.line1);
              if (addr.line2) parts.push(addr.line2);
              setAddresses(parts.length > 0 ? [parts.join(", "), ""] : [""]);
            }
          } else if (typeof data.address === "string") {
            setAddresses([data.address, ""]);
          } else {
            setAddresses([""]);
          }
        } else {
          setAddresses([""]);
        }
      } catch (err: any) {
        setError(err.message || "কিছু ভুল হয়েছে");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const cleanedAddresses = addresses
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (cleanedAddresses.length === 0) {
      setError("কমপক্ষে একটি ঠিকানা দিন");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          // 🔹 এখানে খালি string গেলে আর backend এ "" সেভ হবে না
          image: image || null,
          note,
          address: {
            addresses: cleanedAddresses,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
      }

      const updated: ProfileData = await res.json();
      setProfile(updated);
      setSuccess("প্রোফাইল সফলভাবে আপডেট হয়েছে");
    } catch (err: any) {
      setError(err.message || "কিছু ভুল হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const userEmail = session?.user?.email || profile?.email || "";
  const userRole = (session?.user as any)?.role ?? profile?.role ?? "user";

  const handleAddressChange = (index: number, value: string) => {
    setAddresses((prev) => {
      const newAddresses = [...prev];
      newAddresses[index] = value;
      return newAddresses;
    });
  };

  const handleAddAddress = () => {
    setAddresses((prev) => [...prev, ""]);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAddresses([""]);
    }
  };

 const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const folder = "userProfilePic";

  try {
    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/upload/${folder}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("ইমেজ আপলোড করতে সমস্যা হয়েছে");
    }

    const data = await res.json();

    // 👇 এখানে সব সম্ভাব্য key ধরছি
    const rawUrl: string | undefined =
      data.fileUrl || data.url || data.path || data.location;

    if (!rawUrl) {
      throw new Error("সার্ভার থেকে ইমেজ URL পাওয়া যায়নি");
    }

    let finalUrl = rawUrl;

    // চাইলে এখানে `/api/upload/userProfilePic/filename` ফরম্যাটে নরমালাইজ করতে পারো
    try {
      const base =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost";
      const url = new URL(finalUrl, base);
      const parts = url.pathname.split("/").filter(Boolean);
      const filename = parts[parts.length - 1];

      finalUrl = `/api/upload/${folder}/${filename}`;
    } catch {
      // কিছু হলে rawUrl-টাই ব্যবহার করব
    }

    setImage(finalUrl);
    setSuccess("ইমেজ সফলভাবে আপলোড হয়েছে");
  } catch (err: any) {
    setError(err.message || "ইমেজ আপলোডে ত্রুটি হয়েছে");
  } finally {
    setUploadingImage(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  আমার প্রোফাইল
                </h1>
                <p className="text-white/90 opacity-90">
                  আপনার একাউন্ট তথ্য দেখুন এবং আপডেট করুন
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6 shadow-sm border border-[#5FA3A3]/20 bg-white rounded-2xl">
          {loading ? (
            <p className="text-sm text-[#5FA3A3]">প্রোফাইল লোড হচ্ছে...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Name
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#5FA3A3]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B4B] focus:border-[#0E4B4B] bg-[#F4F8F7]/50 focus:bg-white transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm text-[#0D1414] font-medium">{userEmail}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Phone
                </p>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#5FA3A3]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B4B] focus:border-[#0E4B4B] bg-[#F4F8F7]/50 focus:bg-white transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Role
                </p>
                <p className="inline-flex items-center px-2 py-1 text-[11px] rounded-full bg-[#C0704D]/10 text-[#C0704D] font-semibold border border-[#C0704D]/20">
                  {userRole}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Image URL
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full rounded-xl border border-[#5FA3A3]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B4B] focus:border-[#0E4B4B] bg-[#F4F8F7]/50 focus:bg-white transition-all duration-300"
                    placeholder="/api/upload/userProfilePic/... বা যে কোন ইমেজ URL"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs"
                    />
                    {uploadingImage && (
                      <span className="text-xs text-[#5FA3A3]">
                        ইমেজ আপলোড হচ্ছে...
                      </span>
                    )}
                  </div>
                  {image && (
                    <div className="mt-2">
                      <p className="text-xs text-[#5FA3A3] mb-1">প্রিভিউ:</p>
                      <img
                        src={image}
                        alt="Profile preview"
                        className="h-20 w-20 rounded-full object-cover border-2 border-[#5FA3A3]/30 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                  Note
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#5FA3A3]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B4B] focus:border-[#0E4B4B] bg-[#F4F8F7]/50 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#5FA3A3] uppercase tracking-wide">
                Addresses
              </p>

              {addresses.length === 0 && (
                <p className="text-xs text-[#5FA3A3]">
                  এখনো কোন ঠিকানা যোগ করা হয়নি। নিচের বাটনে ক্লিক করে একটি
                  ঠিকানা যোগ করুন।
                </p>
              )}

              <div className="space-y-3">
                {addresses.map((address, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) =>
                        handleAddressChange(index, e.target.value)
                      }
                      className="flex-1 rounded-xl border border-[#5FA3A3]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B4B] focus:border-[#0E4B4B] bg-[#F4F8F7]/50 focus:bg-white transition-all duration-300"
                      placeholder="Enter full address"
                    />
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(index)}
                        className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300"
                        aria-label="Remove address"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddAddress}
                className="mt-1 inline-flex items-center px-3 py-2 rounded-xl border border-dashed border-[#0E4B4B] text-sm font-medium text-[#0E4B4B] hover:bg-[#F4F8F7] transition-all duration-300"
              >
                + নতুন ঠিকানা যোগ করুন
              </button>
            </div>

            {success && <p className="text-sm text-[#0E4B4B] bg-[#F4F8F7] px-3 py-2 rounded-lg border border-[#5FA3A3]/30">{success}</p>}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
              >
                {saving ? "সেভ হচ্ছে..." : "প্রোফাইল আপডেট করুন"}
              </button>
            </div>
          </form>
          )}
        </Card>
      </div>
    </div>
  );
}
