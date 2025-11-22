// components/blog/BlogDetails.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecentBlogs from "./RecentBlogs"; // Assuming this is the correct path

interface Blog {
  id: number;
  title: string;
  content: string;
  summary: string;
  author: string;
  date: string | Date;
  image?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ----------------------------------------------------------------
// 💡 Add Placeholder for Google AdSense
// Replace the content inside this component with your actual AdSense code (e.g., <ins class="adsbygoogle" ... />)
// ----------------------------------------------------------------
const AdPlaceholder = ({
  title,
  widthClass,
}: {
  title: string;
  widthClass: string;
}) => (
  <div className={`${widthClass} h-full hidden lg:block`}>
    <div className="sticky top-6 p-4 border border-dashed border-emerald-200/50 rounded-2xl bg-gradient-to-br from-emerald-50/30 to-white/50 backdrop-blur-sm h-[600px] flex items-center justify-center text-center text-sm text-emerald-600 shadow-lg">
      <div className="space-y-2">
        <svg className="w-8 h-8 mx-auto text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="font-medium">{title}</p>
      </div>
    </div>
  </div>
);
// ----------------------------------------------------------------

export default function BlogDetails() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const blogId = params?.id;

  // State Hooks
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blog details
  useEffect(() => {
    if (!blogId) {
      setLoading(false);
      setError("Invalid blog ID");
      return;
    }

    const fetchBlogDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/blog/${blogId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }

        const data = await response.json();
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog details:", err);
        setError("Failed to load blog. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [blogId]);

  // Loading and Error States (Enhanced)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">ব্লগ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 flex justify-center items-center p-4">
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200/50 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-3">
            ত্রুটি ঘটেছে!
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            {error || "ব্লগটি খুঁজে পাওয়া যায়নি।"}
          </p>
          <button
            onClick={() => router.push("/kitabghor/blogs")}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            সব ব্লগ দেখুন
          </button>
        </div>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/kitabghor/blogs"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-emerald-200/50 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>ব্লগ সমূহ</span>
          </Link>
          <div className="h-px bg-gradient-to-r from-emerald-200 to-transparent flex-1"></div>
        </div>
      </div>

      {/* Three-Column Grid for Ad Layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] xl:grid-cols-[250px_1fr_250px] gap-6 lg:gap-8">
        {/* 1. Left Ad Column (Hidden on mobile) */}
        <AdPlaceholder
          title="Google Ad (Left Banner)"
          widthClass="lg:w-[200px] xl:w-[250px]"
        />

        {/* 2. Center Content Column */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-emerald-200/30 mb-8">
            {/* Blog Header */}
            <div className="relative">
              {/* Blog Image */}
              <div className="h-96 lg:h-[500px] w-full overflow-hidden">
                {blog.image ? (
                  <>
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📝</span>
                      </div>
                      <span className="text-emerald-600 font-medium">No Image Available</span>
                    </div>
                  </div>
                )}
                
                {/* Blog Badge */}
                <div className="absolute top-6 right-6">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                    ব্লগ পোস্ট
                  </div>
                </div>
              </div>
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {blog.title}
                </h1>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 md:p-12 lg:p-16">
              {/* Enhanced Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8 pb-6 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {blog.author?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{blog.author}</p>
                    <p className="text-xs text-gray-500">লেখক</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{new Date(blog.date).toLocaleDateString("bn-BD", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{new Date(blog.createdAt).toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Summary */}
              {blog.summary && (
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    সারমর্ম
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{blog.summary}</p>
                </div>
              )}

              {/* Main Content */}
              <div
                className="prose prose-lg prose-emerald max-w-none text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: blog.content || "<p>সম্পূর্ণ লেখাটি এখানে নেই।</p>",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* 3. Right Ad/Sidebar Column (Hidden on mobile) */}
        <div className="lg:col-span-1">
          <div className="space-y-8">
            {/* Ad Placeholder (Right) */}
            <AdPlaceholder
              title="Advertisement"
              widthClass="lg:w-[200px] xl:w-[250px]"
            />
          </div>
        </div>
      </div>
      
      {/* Recent Blogs - Below the post for all devices */}
      <div className="mt-12">
        <div className="max-w-7xl mx-auto">
          <RecentBlogs />
        </div>
      </div>
    </div>
  );
}
