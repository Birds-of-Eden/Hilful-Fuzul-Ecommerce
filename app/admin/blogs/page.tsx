import BlogCard from "@/components/admin/blog/BlogCard.tsx";

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="bg-white/90 border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
        </div>
        <div className="p-5">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>
      </div>
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
