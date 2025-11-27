// components/blog/BlogList.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

interface Blog {
  id: number;
  slug?: string;
  title: string;
  summary: string;
  author: string;
  date: string | Date;
  image?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Helper function to format the time since creation in Bengali (e.g., "১৫ মিনিট আগে")
const formatFacebookTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);

  const diffMs = now.getTime() - past.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // ---- Facebook Short Rules ----
  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;

  // ---- Yesterday ----
  if (days === 1) {
    return `Yesterday at ${past.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  // ---- Same Year → March 12 at 3:45 PM ----
  if (past.getFullYear() === now.getFullYear()) {
    return past.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }) + 
    " at " +
    past.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // ---- Previous Years → March 12, 2022 at 3:45 PM ----
  return past.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + 
  " at " +
  past.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AllBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Note: Public blogs might not need search or pagination initially,
  // but I'm keeping the logic for robustness.

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10", // Showing 10 blogs per page
      });

      // API call to fetch all blogs
      const response = await fetch(`/api/blog?${params}`);
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await response.json() : null;

      if (response.ok && data?.blogs) {
        setBlogs(data.blogs);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      // Optionally show a user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">ব্লগ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200/50 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            কোনো ব্লগ পোস্ট পাওয়া যায়নি
          </h3>
          <p className="text-gray-600 leading-relaxed">নতুন পোস্টের জন্য অপেক্ষা করুন।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-1/4 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-12 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full shadow-lg"></div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                সাম্প্রতিক ব্লগ পোস্ট
              </h1>
              <div className="w-3 h-12 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-full shadow-lg"></div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Enhanced Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/kitabghor/blogs/${blog.slug || generateSlug(blog.title)}`}
              className="group block"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-emerald-200/30 hover:border-emerald-400/50 transform hover:scale-105 hover:-translate-y-2">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                  {blog.image ? (
                    <>
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">📝</span>
                        </div>
                        <span className="text-emerald-600 font-medium">No Image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Blog Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ব্লগ
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 hover:text-emerald-600 transition-colors duration-300 line-clamp-2 group-hover:translate-x-1 transform">
                    {blog.title}
                  </h2>
                  <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                    {blog.summary}
                  </p>

                  {/* Enhanced Meta Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                      <p className="text-sm font-medium text-emerald-600">
                        {formatFacebookTime(blog.createdAt)}
                      </p>
                    </div>
                    <div className="text-emerald-600 group-hover:translate-x-1 transition-transform duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-16 gap-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              পূর্ববর্তী
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-full font-medium transition-all duration-300 ${
                    page === pageNum
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-white/80 text-gray-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              পরবর্তী
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
