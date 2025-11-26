'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';

const BlogForm = dynamic(() => import('./BlogForm'), { ssr: false });

interface Blog {
  id: number;
  title: string;
  summary: string;
  author: string;
  date: string | Date;
  image?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function BlogCard() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/blog?${params}`);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (response.ok && data) {
        setBlogs(data.blogs);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, searchTerm]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchBlogs();
      } else {
        alert('Error deleting blog');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E4B4B] mx-auto mb-4"></div>
          <p className="text-[#0D1414]">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0E4B4B] to-[#086666] rounded-2xl shadow-lg p-6 border border-[#F4F8F7]/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F8F7] mb-2">Blog Management</h1>
            <p className="text-[#F4F8F7]/70 text-sm">Create and manage your blog posts</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#C0704D] hover:bg-[#A85D3F] text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 border border-[#C0704D] hover:border-[#A85D3F] flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Blog Post</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#819A91] w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 bg-[#EEEFE0] border border-[#D1D8BE] rounded-xl focus:ring-2 focus:ring-[#819A91] focus:border-[#819A91] text-[#0D1414] placeholder-[#2D4A3C]/50 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white/90 backdrop-blur-sm border border-[#D1D8BE] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden group relative">
              {/* Clickable overlay that doesn't interfere with buttons */}
              <Link 
                href={`/admin/blogs/edit/${blog.id}`}
                className="absolute inset-0 z-0" 
                aria-label={`Edit ${blog.title}`}
              />
              
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {blog.image ? (
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE] flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#819A91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E4B4B]/10 to-[#086666]/10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-[#0D1414] line-clamp-2 mb-2 group-hover:text-[#0E4B4B] transition-colors duration-300">
                  {blog.title}
                </h3>
                <p className="text-[#2D4A3C]/70 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {blog.summary}
                </p>
                
                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm text-[#2D4A3C]/50 mb-4">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{blog.author}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(blog.date).toLocaleDateString("bn-BD")}</span>
                  </span>
                </div>

                {/* Actions - Wrapped in a div with higher z-index to stay above the clickable overlay */}
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#D1D8BE]">
                  <Link
                    href={`/admin/blogs/edit/${blog.id}`}
                    className="flex items-center space-x-2 text-[#0E4B4B] hover:text-[#086666] font-medium text-sm transition-colors duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(blog.id);
                    }}
                    className="flex items-center space-x-2 text-[#C0704D] hover:text-[#A85D3F] font-medium text-sm transition-colors duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm border border-[#D1D8BE] rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-[#EEEFE0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#819A91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#0D1414] mb-2">No blogs found</h3>
          <p className="text-[#2D4A3C]/70 mb-6">Get started by creating your first blog post</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#C0704D] hover:bg-[#A85D3F] text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 border border-[#C0704D] hover:border-[#A85D3F]"
          >
            Create Blog Post
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/90 backdrop-blur-sm border border-[#D1D8BE] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center space-x-2 px-4 py-2 border border-[#D1D8BE] rounded-xl text-[#0D1414] hover:bg-[#EEEFE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-medium transition-all duration-300 ${
                    page === pageNum
                      ? 'bg-gradient-to-r from-[#0E4B4B] to-[#086666] text-white shadow-lg'
                      : 'text-[#2D4A3C] hover:bg-[#EEEFE0]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="flex items-center space-x-2 px-4 py-2 border border-[#D1D8BE] rounded-xl text-[#0D1414] hover:bg-[#EEEFE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Blog Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm border border-[#D1D8BE] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#D1D8BE] bg-gradient-to-r from-[#0E4B4B]/5 to-[#086666]/5">
              <h3 className="text-xl font-semibold text-[#0D1414]">Create New Blog</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#2D4A3C]/50 hover:text-[#0D1414] transition-all duration-300 p-2 rounded-lg hover:bg-[#EEEFE0]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <BlogForm 
                onSuccess={() => {
                  setIsModalOpen(false);
                  fetchBlogs();
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}