// components/blog/RecentBlogs.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

interface Blog {
  id: number;
  slug?: string;
  title: string;
  summary: string;
  image?: string;
  createdAt: string | Date;
}

// Helper function to format the date concisely (e.g., Nov 13, 2025)
const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function RecentBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentBlogs = async () => {
    try {
      setLoading(true);
      // Fetch only 3 recent blogs (page=1, limit=3)
      const params = new URLSearchParams({
        page: "1",
        limit: "3",
        // Assuming your API sorts by 'createdAt' descending by default
        // If not, you might need a 'sort: 'newest'' parameter here
      });

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (response.ok && data?.blogs) {
        setBlogs(data.blogs);
      }
    } catch (error) {
      console.error("Error fetching recent blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentBlogs();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          সাম্প্রতিক পোস্ট
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return null; // Or show a message if preferred
  }

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-extrabold text-gray-900 mb-5 border-b pb-2">
        🔥 সাম্প্রতিক পোস্ট
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/kitabghor/blogs/${blog.slug || generateSlug(blog.title)}`}
            className="flex space-x-4 group hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 -mx-2"
          >
            {/* Image (Small Thumbnail) */}
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
              {blog.image ? (
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                {blog.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(blog.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
