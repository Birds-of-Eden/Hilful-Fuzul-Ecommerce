"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isValid: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    isValid: true,
    expiresAt: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Coupon ${editingCoupon ? "updated" : "created"} successfully`,
        });
        fetchCoupons();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingCoupon(null);
        setFormData({
          code: "",
          discountType: "",
          discountValue: "",
          minOrderValue: "",
          maxDiscount: "",
          usageLimit: "",
          isValid: true,
          expiresAt: "",
        });
      } else {
        throw new Error("Failed to save coupon");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save coupon",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Success", description: "Coupon deleted successfully" });
        fetchCoupons();
      } else {
        throw new Error("Failed to delete coupon");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue?.toString() || "",
      maxDiscount: coupon.maxDiscount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      isValid: coupon.isValid,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  placeholder={
                    formData.discountType === "percentage" ? "10" : "100"
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="minOrderValue">
                  Minimum Order Value (Optional)
                </Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  step="0.01"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderValue: e.target.value })
                  }
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">Maximum Discount (Optional)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscount: e.target.value })
                  }
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Create Coupon
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {coupon.code}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% off`
                      : `৳${coupon.discountValue} off`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className={coupon.isValid ? "default" : "secondary"}>
                    {coupon.isValid ? "Active" : "Inactive"}
                  </div>
                  {isExpired(coupon.expiresAt) && (
                    <div className="destructive">Expired</div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Used:</span>
                  <p className="font-medium">
                    {coupon.usedCount} / {coupon.usageLimit || "∞"}
                  </p>
                </div>
                {coupon.minOrderValue && (
                  <div>
                    <span className="text-gray-500">Min Order:</span>
                    <p className="font-medium">৳{coupon.minOrderValue}</p>
                  </div>
                )}
                {coupon.maxDiscount && (
                  <div>
                    <span className="text-gray-500">Max Discount:</span>
                    <p className="font-medium">৳{coupon.maxDiscount}</p>
                  </div>
                )}
                {coupon.expiresAt && (
                  <div>
                    <span className="text-gray-500">Expires:</span>
                    <p className="font-medium">
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Created: {new Date(coupon.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Coupon Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-discountType">Discount Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-discountValue">Discount Value</Label>
              <Input
                id="edit-discountValue"
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-minOrderValue">Minimum Order Value</Label>
              <Input
                id="edit-minOrderValue"
                type="number"
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderValue: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-maxDiscount">Maximum Discount</Label>
              <Input
                id="edit-maxDiscount"
                type="number"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) =>
                  setFormData({ ...formData, maxDiscount: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-usageLimit">Usage Limit</Label>
              <Input
                id="edit-usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-expiresAt">Expiry Date</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isValid"
                checked={formData.isValid}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isValid: checked as boolean })
                }
              />
              <Label htmlFor="edit-isValid">Active</Label>
            </div>
            <Button type="submit" className="w-full">
              Update Coupon
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
