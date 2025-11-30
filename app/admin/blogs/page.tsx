'use client';

import BlogCard from "@/components/admin/blog/BlogCard.tsx";

// Skeleton Loader Component
const BlogCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#D1D8BE] animate-pulse">
    {/* Image Skeleton */}
    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
    
    {/* Content Skeleton */}
    <div className="p-6">
      {/* Title Skeleton */}
      <div className="h-6 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
      
      {/* Author Skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      
      {/* Date Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      
      {/* Summary Skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

// Skeleton Grid Component
const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }, (_, i) => (
      <BlogCardSkeleton key={i} />
    ))}
  </div>
);

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0] p-4 sm:p-6">
      <div>
        <BlogCard />
      </div>
    </div>
  );
}
