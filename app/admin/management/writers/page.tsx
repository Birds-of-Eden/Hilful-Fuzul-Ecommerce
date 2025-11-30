"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import WritersManager from "@/components/management/WritersManager";

interface Writer {
  id: number;
  name: string;
  bio?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WritersPage() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [writersCache, setWritersCache] = useState<Map<string, Writer[]>>(new Map());

  // Memoize fetch function with caching
  const fetchWriters = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = "all";
      if (writersCache.has(cacheKey)) {
        const cachedData = writersCache.get(cacheKey);
        if (cachedData) {
          setWriters(cachedData);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/writers");
      const data = await res.json();
      
      // Update cache
      setWritersCache(prev => new Map(prev).set(cacheKey, data));
      setWriters(data);
    } catch (err) {
      console.error("Failed to fetch writers:", err);
    } finally {
      setLoading(false);
    }
  }, [writersCache]);

  useEffect(() => {
    fetchWriters();
  }, [fetchWriters]);

  // Memoize CRUD operations
  const handleCreate = useCallback(async (payload: any) => {
    const res = await fetch("/api/writers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const newWriter = await res.json();

    // Update state and cache
    setWriters((prev) => [newWriter, ...prev]);
    setWritersCache(prev => {
      const newCache = new Map(prev);
      const current = newCache.get("all") || [];
      newCache.set("all", [newWriter, ...current]);
      return newCache;
    });
  }, []);

  const handleUpdate = useCallback(async (id: number, payload: any) => {
    const res = await fetch(`/api/writers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();

    // Update state and cache
    setWriters((prev) =>
      prev.map((writer) => (writer.id === id ? updated : writer))
    );
    setWritersCache(prev => {
      const newCache = new Map(prev);
      const current = newCache.get("all") || [];
      newCache.set("all", current.map((writer) => (writer.id === id ? updated : writer)));
      return newCache;
    });
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await fetch(`/api/writers/${id}`, {
      method: "DELETE",
    });

    // Clear cache to force refresh
    setWritersCache(new Map());
    await fetchWriters(); // Refresh the list from backend so we only show deleted: false writers
  }, [fetchWriters]);

  // Memoize data to prevent unnecessary re-renders
  const memoizedWriters = useMemo(() => writers, [writers]);

  // Skeleton loader components
  const WriterCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  const WritersGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <WriterCardSkeleton key={i} />
      ))}
    </div>
  );
    
  return (
    <WritersManager
      writers={memoizedWriters}
      loading={loading}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      WriterCardSkeleton={WriterCardSkeleton}
      WritersGridSkeleton={WritersGridSkeleton}
    />
  );
}
