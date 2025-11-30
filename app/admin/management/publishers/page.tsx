"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PublishersManager from "@/components/management/PublishersManager";

interface Publisher {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishersCache, setPublishersCache] = useState<Map<string, Publisher[]>>(new Map());

  // Memoize fetch function with caching
  const fetchPublishers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = "all";
      if (publishersCache.has(cacheKey)) {
        const cachedData = publishersCache.get(cacheKey);
        if (cachedData) {
          setPublishers(cachedData);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/publishers");
      const data = await res.json();
      
      // Update cache
      setPublishersCache(prev => new Map(prev).set(cacheKey, data));
      setPublishers(data);
    } finally {
      setLoading(false);
    }
  }, [publishersCache]);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  // Memoize CRUD operations
  const onCreate = useCallback(async (payload: any) => {
    const res = await fetch("/api/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const newPub = await res.json();

    // Update state and cache
    setPublishers((prev) => [newPub, ...prev]);
    setPublishersCache(prev => {
      const newCache = new Map(prev);
      const current = newCache.get("all") || [];
      newCache.set("all", [newPub, ...current]);
      return newCache;
    });
  }, []);

  const onUpdate = useCallback(async (id: number, payload: any) => {
    const res = await fetch(`/api/publishers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();

    // Update state and cache
    setPublishers((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setPublishersCache(prev => {
      const newCache = new Map(prev);
      const current = newCache.get("all") || [];
      newCache.set("all", current.map((p) => (p.id === id ? updated : p)));
      return newCache;
    });
  }, []);

  const onDelete = useCallback(async (id: number) => {
    await fetch(`/api/publishers/${id}`, { method: "DELETE" });
    
    // Clear cache to force refresh
    setPublishersCache(new Map());
    await fetchPublishers(); // refresh list instead of manually filtering
  }, [fetchPublishers]);

  // Memoize data to prevent unnecessary re-renders
  const memoizedPublishers = useMemo(() => publishers, [publishers]);

  // Skeleton loader components
  const PublisherCardSkeleton = () => (
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
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );

  const PublishersGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <PublisherCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <PublishersManager
      publishers={memoizedPublishers}
      loading={loading}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      PublisherCardSkeleton={PublisherCardSkeleton}
      PublishersGridSkeleton={PublishersGridSkeleton}
    />
  );
}
