"use client";

import { useEffect, useState } from "react";
import CategoryManager from "@/components/management/CategoryManager";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (payload: any) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const newCat = await res.json();
    setCategories((prev) => [newCat, ...prev]);
  };

  const handleUpdate = async (id: number, payload: any) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();

    setCategories((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories(); // refresh list after soft delete
  };

  return (
    <CategoryManager
      categories={categories}
      loading={loading}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
