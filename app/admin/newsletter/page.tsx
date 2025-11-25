"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, Edit, Trash2, Eye } from "lucide-react";

interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export default function NewsletterManagement() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [sendingId, setSendingId] = useState<string | null>(null);

  const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null);

  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch("/api/newsletter");
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch newsletters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingNewsletter
        ? `/api/newsletter/${editingNewsletter.id}`
        : "/api/newsletter";
      const method = editingNewsletter ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Newsletter ${editingNewsletter ? "updated" : "created"} successfully`,
        });
        fetchNewsletters();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingNewsletter(null);
        setFormData({ title: "", subject: "", content: "" });
      } else {
        throw new Error("Failed to save newsletter");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save newsletter",
        variant: "destructive",
      });
    }
  };

  const handleSend = async (id: string) => {
    try {
      setSendingId(id);
      const response = await fetch(`/api/newsletter/${id}/send`, {
        method: "POST",
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Newsletter sent successfully",
        });
        fetchNewsletters();
      } else {
        throw new Error("Failed to send newsletter");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this newsletter?")) return;

    try {
      const response = await fetch(`/api/newsletter/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Newsletter deleted successfully",
        });
        fetchNewsletters();
      } else {
        throw new Error("Failed to delete newsletter");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete newsletter",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setFormData({
      title: newsletter.title,
      subject: newsletter.subject,
      content: newsletter.content,
    });
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (newsletter: Newsletter) => {
    setPreviewNewsletter(newsletter);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading newsletters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Newsletter Management
        </h1>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Newsletter
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Create New Newsletter
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={8}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Newsletter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {newsletters.map((newsletter) => (
          <Card
            key={newsletter.id}
            className="hover:shadow-lg transition border-gray-200"
          >
            <CardHeader>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {newsletter.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {newsletter.subject}
                  </p>
                </div>

                <div
                  className={`px-2 py-1 rounded-full text-xs ${
                    newsletter.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {newsletter.status}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {newsletter.content}
              </p>

              <div className="text-xs text-gray-500 border-t pt-3">
                <div>
                  Created: {new Date(newsletter.createdAt).toLocaleDateString()}
                </div>
                {newsletter.sentAt && (
                  <div>Sent: {new Date(newsletter.sentAt).toLocaleDateString()}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {/* Preview */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreviewDialog(newsletter)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>

                {/* Edit */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(newsletter)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                {/* Send */}
                {newsletter.status !== "sent" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendingId === newsletter.id}
                    onClick={() => handleSend(newsletter.id)}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {sendingId === newsletter.id ? "Sending..." : "Send"}
                  </Button>
                )}

                {/* Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(newsletter.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Newsletter</DialogTitle>
          </DialogHeader>

          {previewNewsletter && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{previewNewsletter.title}</h2>
              <p className="text-gray-600">{previewNewsletter.subject}</p>

              <div className="bg-gray-100 rounded p-4 whitespace-pre-line">
                {previewNewsletter.content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Edit Newsletter
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Newsletter
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
