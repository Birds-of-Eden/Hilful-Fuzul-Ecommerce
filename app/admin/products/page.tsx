"use client";

import { useEffect, useState } from "react";
import ProductManager from "@/components/management/ProductManager";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  writer?: any;
  publisher?: any;
  category?: any;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [writers, setWriters] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOAD ALL
  const loadAll = async () => {
    setLoading(true);

    const [p, w, pub, c] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/writers").then((r) => r.json()),
      fetch("/api/publishers").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);

    setProducts(p);
    setWriters(w);
    setPublishers(pub);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // CREATE
  const createProduct = async (data: any) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const newProd = await res.json();
    setProducts([newProd, ...products]);
  };

  // UPDATE
  const updateProduct = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      const updated = await res.json();

      // Update UI state
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));

      return updated;
    } catch (error) {
      console.error("Update product error:", error);
      throw error;
    }
  };

  // DELETE
  const deleteProduct = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await loadAll(); // 🔥 Refresh full product list from backend
  };

  return (
    <ProductManager
      products={products}
      writers={writers}
      publishers={publishers}
      categories={categories}
      loading={loading}
      onCreate={createProduct}
      onUpdate={updateProduct}
      onDelete={deleteProduct}
    />
  );
}
