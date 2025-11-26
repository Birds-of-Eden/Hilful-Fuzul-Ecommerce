"use client";

import { useEffect, useState } from "react";
import PublishersManager from "@/components/management/PublishersManager";

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/publishers");
      const data = await res.json();
      setPublishers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, []);

  const onCreate = async (payload: any) => {
    const res = await fetch("/api/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const newPub = await res.json();
    setPublishers((prev) => [newPub, ...prev]);
  };

  const onUpdate = async (id: number, payload: any) => {
    const res = await fetch(`/api/publishers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();
    setPublishers((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const onDelete = async (id: number) => {
    await fetch(`/api/publishers/${id}`, { method: "DELETE" });
    fetchPublishers(); // refresh list instead of manually filtering
  };

  return (
    <PublishersManager
      publishers={publishers}
      loading={loading}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}
