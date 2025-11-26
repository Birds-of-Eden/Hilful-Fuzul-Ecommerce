"use client";

import { useEffect, useState } from "react";
import WritersManager from "@/components/management/WritersManager";

export default function WritersPage() {
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWriters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/writers");
      const data = await res.json();
      setWriters(data);
    } catch (err) {
      console.error("Failed to fetch writers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWriters();
  }, []);

  const handleCreate = async (payload: any) => {
    const res = await fetch("/api/writers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const newWriter = await res.json();

    setWriters((prev) => [newWriter, ...prev]);
  };

  const handleUpdate = async (id: number, payload: any) => {
    const res = await fetch(`/api/writers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();

    setWriters((prev) =>
      prev.map((writer) => (writer.id === id ? updated : writer))
    );
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/writers/${id}`, {
      method: "DELETE",
    });

    // Refresh the list from backend so we only show deleted: false writers
    fetchWriters();
  };
    
  return (
    <WritersManager
      writers={writers}
      loading={loading}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
