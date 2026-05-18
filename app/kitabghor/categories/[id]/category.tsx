"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Heart,
  ShoppingCart,
  BookOpen,
  ArrowLeft,
  Star,
  Filter,
  BookText,
} from "lucide-react";
import { BookCard } from "@/components/ecommarce/BookCard";

interface CategoryPageProps {
  category: {
    id: number;
    name: string;
  } | null;
  categoryBooks: Array<{
    id: number;
    name: string;
    image: string | null;
    price: number;
    original_price?: number | null;
    discount: number;
    writer: {
      id: number;
      name: string;
    };
    stock?: number;
  }>;
  categoryCount: number | null;
  loading: boolean;
  error: string | null;
  ratings: Record<string, { averageRating: number; totalReviews: number }>;
  toggleWishlist: (bookId: number) => void;
  handleAddToCart: (book: any) => void;
  isInWishlist: (bookId: number) => boolean;
}

export default function CategoryPage({
  category,
  categoryBooks,
  categoryCount,
  loading,
  error,
  ratings,
  toggleWishlist,
  handleAddToCart,
  isInWishlist,
}: CategoryPageProps) {
  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white flex items-center justify-center">
        <p className="text-[#5FA3A3]">ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  // ✅ Error or not-found state
  if (!category || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <BookText className="h-16 w-16 text-[#5FA3A3]/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0D1414] mb-2">
            বিভাগ পাওয়া যায়নি
          </h2>
          <p className="text-[#5FA3A3] mb-6">
            আপনার অনুসন্ধানকৃত বিভাগটি খুঁজে পাওয়া যায়নি
          </p>
          <Link href="/kitabghor/categories">
            <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
              সকল বিভাগ দেখুন
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/kitabghor/categories"
                className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span>সকল বিভাগ</span>
              </Link>
              <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full" />
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-[#5FA3A3]/30">
              <Filter className="h-4 w-4 text-[#0E4B4B]" />
              <span className="text-sm text-[#5FA3A3]">সাজান:</span>
              <select className="bg-transparent border-0 text-sm focus:outline-none focus:ring-0">
                <option>সর্বশেষ</option>
                <option>নাম অনুসারে</option>
                <option>দাম অনুসারে</option>
              </select>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  {category.name}
                </h1>
                <p className="text-white/90 opacity-90">
                  এই বিভাগের সকল বইয়ের সংগ্রহ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>মোট {categoryBooks.length} টি বই</span>
              </div>

              {categoryCount !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>{categoryCount}টি বিভাগ</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>১০০% গুণগত মান</span>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {categoryBooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <BookOpen className="h-16 w-16 text-[#5FA3A3]/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#0D1414] mb-2">
              কোন বই পাওয়া যায়নি
            </h3>
            <p className="text-[#5FA3A3] mb-6">
              এই বিভাগে এখনও কোন বই যোগ করা হয়নি
            </p>
            <Link href="/kitabghor/categories">
              <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
                অন্যান্য বিভাগ দেখুন
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryBooks.map((book, index) => {
              const enhancedBook = {
                ...book,
                isBestseller: index % 3 === 0,
                isNew: index % 4 === 0,
              };
              const isWishlisted = isInWishlist(book.id);

              const ratingInfo = ratings[String(book.id)];
              const avgRating = ratingInfo?.averageRating ?? 0;
              const reviewCount = ratingInfo?.totalReviews ?? 0;

              return (
                <BookCard
                  key={book.id}
                  book={{
                    id: book.id,
                    name: book.name,
                    price: book.price,
                    original_price: book.original_price ?? 0,
                    discount: book.discount,
                    writer: book.writer,
                    publisher: null,
                    image: book.image || "/placeholder.svg",
                    stock: book.stock,
                  }}
                  ratingInfo={{
                    averageRating: avgRating,
                    totalReviews: reviewCount,
                  }}
                  isWishlisted={isWishlisted}
                  onWishlistToggle={() => toggleWishlist(book.id)}
                  onAddToCart={() => handleAddToCart(book)}
                />
              );
            })}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-[#5FA3A3]/30">
          <Link
            href="/kitabghor/categories"
            className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>সকল বিভাগে ফিরে যান</span>
          </Link>

          <div className="text-sm text-[#5FA3A3]">
            মোট{" "}
            <span className="font-semibold text-[#0E4B4B]">
              {categoryBooks.length}
            </span>{" "}
            টি বই
          </div>
        </div>
      </div>
    </div>
  );
}
