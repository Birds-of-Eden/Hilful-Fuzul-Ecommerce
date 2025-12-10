"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Users,
  Search,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Publisher {
  id: number;
  name: string;
  image?: string;
  productCount?: number;
}

interface PublishersManagerProps {
  publishers: Publisher[];
  loading: boolean;
  onCreate: (data: { name: string; image?: string }) => Promise<void>;
  onUpdate: (id: number, data: { name: string; image?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function PublishersManager({
  publishers = [],
  loading = false,
  onCreate,
  onUpdate,
  onDelete,
}: PublishersManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Publisher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    image: "",
  });

  const filtered = publishers.filter((pub) =>
    pub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", image: "" });
    setModalOpen(true);
  };

  const openEdit = (pub: Publisher) => {
    setEditing(pub);
    setForm({
      name: pub.name,
      image: pub.image || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("নাম দিন");
      return;
    }
    setSubmitting(true);

    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: form.name,
          image: form.image,
        });
        toast.success("আপডেট সম্পন্ন");
      } else {
        await onCreate({
          name: form.name,
          image: form.image,
        });
        toast.success("নতুন প্রকাশক যোগ হয়েছে");
      }
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocal = (id: number) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await onDelete(deletingId); // wait for soft delete API
      toast.success("প্রকাশকটি সফলভাবে ডিলিট করা হয়েছে");
    } catch (error) {
      console.error('Error deleting publisher:', error);
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE]/30">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-2 h-10 bg-gradient-to-b from-[#2C4A3B] to-[#819A91] rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2C4A3B] to-[#819A91] bg-clip-text text-transparent">
            প্রকাশক ব্যবস্থাপনা
          </h1>
          <div className="w-2 h-10 bg-gradient-to-b from-[#819A91] to-[#2C4A3B] rounded-full"></div>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          প্রকাশকদের তালিকা দেখুন, যোগ করুন ও ম্যানেজ করুন
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-white/80 shadow rounded-2xl">
          <CardContent className="p-6 flex justify-between">
            <div>
              <p className="text-gray-600 text-sm">মোট প্রকাশক</p>
              <h2 className="text-2xl font-bold">{publishers.length}</h2>
            </div>
            <Users className="h-10 w-10 text-[#2C4A3B]" />
          </CardContent>
        </Card>

        <Card className="bg-white/80 shadow rounded-2xl">
          <CardContent className="p-6 flex justify-between">
            <div>
              <p className="text-gray-600 text-sm">মোট বই সংখ্যা</p>
              <h2 className="text-2xl font-bold">
                {publishers.reduce(
                  (a: number, p: any) => a + (p.productCount || 0),
                  0
                )}
              </h2>
            </div>
            <BookOpen className="h-10 w-10 text-[#2C4A3B]" />
          </CardContent>
        </Card>

        <Card className="bg-white/80 shadow rounded-2xl">
          <CardContent className="p-6 flex flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="অনুসন্ধান করুন..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button onClick={openAdd} className="bg-[#2C4A3B] text-white px-5">
              <Plus className="h-4 w-4 mr-1" /> নতুন
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Publishers Grid */}
      {loading ? (
        <p className="text-center text-lg mt-20">লোড হচ্ছে...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((pub) => (
            <Card key={pub.id} className="rounded-2xl shadow bg-white">
              <div className="h-48 bg-gray-100 rounded-t-2xl overflow-hidden flex itemsCenter justify-center">
                {pub.image ? (
                  <Image
                    src={pub.image}
                    alt={`${pub.name}'s logo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <Users className="h-16 w-16 text-gray-400" />
                )}
              </div>

              <CardContent className="p-5">
                <h3 className="text-xl font-bold">{pub.name}</h3>
                <p className="text-gray-600 mt-1">
                  Total Books: {pub.productCount || 0}
                </p>

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => openEdit(pub)}
                    className="bg-[#2C4A3B] text-white w-full"
                  >
                    <Edit3 className="h-3 w-3 mr-1" /> এডিট
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocal(pub.id);
                    }}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editing ? "прকাশক আপডেট" : "নতুন প্রকাশক"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <Label>প্রকাশকের নাম *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>ছবি আপলোড করুন</Label>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const folder = "publishers"; // 🔹 folder name

                    const fd = new FormData();
                    fd.append("file", file);

                    try {
                      toast.loading("Uploading...", { id: "upload-publisher" });

                      const res = await fetch(`/api/upload/${folder}`, {
                        method: "POST",
                        body: fd,
                      });

                      if (!res.ok) {
                        throw new Error("Upload failed");
                      }

                      const data = await res.json();

                      // বিভিন্ন কী হ্যান্ডেল করি
                      const rawUrl: string | undefined =
                        data.fileUrl || data.url || data.path || data.location;

                      if (!rawUrl) {
                        throw new Error("Server did not return image URL");
                      }

                      let finalUrl = rawUrl;
                      try {
                        const base =
                          typeof window !== "undefined"
                            ? window.location.origin
                            : "http://localhost";
                        const url = new URL(rawUrl, base);
                        const parts = url.pathname.split("/").filter(Boolean);
                        const filename = parts[parts.length - 1];

                        // final public API path
                        finalUrl = `/api/upload/${folder}/${filename}`;
                      } catch {
                        // parse error হলে rawUrl ই ব্যবহার করব
                      }

                      setForm((prev) => ({ ...prev, image: finalUrl }));
                      toast.success("Upload complete!", {
                        id: "upload-publisher",
                      });
                    } catch (error) {
                      console.error("Publisher image upload error:", error);
                      toast.error("Upload failed!", { id: "upload-publisher" });
                    }
                  }}
                />

                {form.image && (
                  <div className="relative w-20 h-20 mt-3">
                    <Image
                      src={form.image}
                      alt="Publisher preview"
                      fill
                      className="rounded-lg border object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                বাতিল
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.name}
                className="bg-[#2C4A3B] text-white"
              >
                <Zap className="h-4 w-4 mr-1" />
                {editing ? "আপডেট" : "তৈরি করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">মুছে ফেলুন</h3>
              <p className="text-gray-600 mb-6">
                আপনি কি নিশ্চিত যে আপনি এই প্রকাশকটিকে মুছে ফেলতে চান? এই কাজটি
                পূর্বাবস্থায় ফেরানো যাবে না।
              </p>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-6"
                >
                  বাতিল
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                >
                  মুছে ফেলুন
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
