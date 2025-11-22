"use client";

import { useState, useEffect } from "react";

export function useNewOrdersCount() {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNewOrdersCount = async () => {
    try {
      const res = await fetch("/api/admin/orders/new-count", { 
        cache: "no-store" 
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch new orders count:", error);
    } finally {
      setLoading(false);
    }
  };

  const markOrdersAsViewed = async () => {
    try {
      const res = await fetch("/api/admin/orders/mark-viewed", {
        method: "POST",
      });
      
      if (res.ok) {
        // Reset count to 0 immediately
        setNewOrdersCount(0);
      }
    } catch (error) {
      console.error("Failed to mark orders as viewed:", error);
    }
  };

  useEffect(() => {
    fetchNewOrdersCount();

    // Set up polling to check for new orders every 30 seconds
    const interval = setInterval(fetchNewOrdersCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { newOrdersCount, loading, markOrdersAsViewed };
}
