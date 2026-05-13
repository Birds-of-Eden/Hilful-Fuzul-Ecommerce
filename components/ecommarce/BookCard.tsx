"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Heart, ShoppingCart, Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: {
    id: string | number;
    name: string;
    price: number;
    original_price: number | null;
    discount: number;
    writer: { id: string | number; name: string } | null;
    publisher: { id: string | number; name: string } | null;
    image: string;
    stock?: number;
    available?: boolean;
    deleted?: boolean;
    isPreOrder?: boolean;
    preOrderEndDate?: string;
    preOrderDiscount?: number;
  };
  ratingInfo?: {
    averageRating: number;
    totalReviews: number;
  };
  isWishlisted?: boolean;
  onWishlistToggle?: (book: any) => void;
  onAddToCart?: (book: any) => void;
  className?: string;
  variant?: "default" | "horizontal" | "compact";
  showBadges?: boolean;
  showRating?: boolean;
  showAuthor?: boolean;
  showPublisher?: boolean;
}

export function BookCard({
  book,
  ratingInfo,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  className,
  variant = "default",
  showBadges = true,
  showRating = true,
  showAuthor = true,
  showPublisher = false,
}: BookCardProps) {
  const avgRating = ratingInfo?.averageRating ?? 0;
  const reviewCount = ratingInfo?.totalReviews ?? 0;
  const isBestseller = false; // You can calculate this based on sales data
  const isNew = false; // You can calculate this based on created date

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlistToggle?.(book);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(book);
  };

  // Horizontal variant layout
  if (variant === "horizontal") {
    return (
      <Card
        className={cn(
          "group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F4F8F7] rounded-xl",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <Link
            href={`/kitabghor/books/${book.id}`}
            className="relative sm:w-40 md:w-48 flex-shrink-0"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-white p-4">
              <Image
                src={book.image || "/placeholder.svg"}
                alt={book.name}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            </div>
          </Link>

          {/* Content Section */}
          <div className="flex-1 p-5">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                {/* Title */}
                <Link href={`/kitabghor/books/${book.id}`}>
                  <h3 className="font-bold text-lg md:text-xl text-[#0D1414] hover:text-[#0E4B4B] transition-colors line-clamp-2">
                    {book.name}
                  </h3>
                </Link>

                {/* Author & Publisher */}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#5FA3A3]">
                  {showAuthor && book.writer && (
                    <span className="flex items-center">
                      <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
                      {book.writer.name}
                    </span>
                  )}
                  {showPublisher && book.publisher && (
                    <span className="flex items-center">
                      <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
                      {book.publisher.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Wishlist Button */}
              {onWishlistToggle && (
                <button
                  onClick={handleWishlistClick}
                  className={cn(
                    "p-2 rounded-full backdrop-blur-sm transition-all duration-300 flex-shrink-0",
                    isWishlisted
                      ? "bg-red-500/20 text-red-500"
                      : "bg-white/80 text-[#5FA3A3] hover:bg-red-500/20 hover:text-red-500"
                  )}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-all",
                      isWishlisted && "scale-110 fill-current"
                    )}
                  />
                </button>
              )}
            </div>

            {/* Rating */}
            {showRating && (
              <div className="flex items-center gap-1 mt-3">
                {reviewCount > 0 ? (
                  <>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-3 w-3",
                            star <= Math.round(avgRating)
                              ? "fill-[#C0704D] text-[#C0704D]"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#5FA3A3] ml-1">
                      ({avgRating.toFixed(1)} · {reviewCount})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#5FA3A3]">কোন রিভিউ নেই</span>
                )}
              </div>
            )}

            {/* Price & Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-xl text-[#0E4B4B]">
                  ৳{book.price}
                </span>
                {book.discount > 0 && (
                  <span className="text-sm text-[#5FA3A3] line-through">
                    ৳{book.original_price}
                  </span>
                )}
                {book.discount > 0 && (
                  <span className="text-xs font-semibold bg-[#C0704D] text-white px-2 py-0.5 rounded-full">
                    {book.discount}% ছাড়
                  </span>
                )}
              </div>

              {onAddToCart && (
                <Button
                  disabled={book.stock === 0}
                  onClick={handleAddToCartClick}
                  size="sm"
                  className={cn(
                    "rounded-lg text-white font-semibold transition-all duration-300",
                    book.stock === 0
                      ? "bg-gray-400 cursor-not-allowed opacity-60"
                      : "bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3]"
                  )}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {book.stock === 0 ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Compact variant layout
  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-[#F4F8F7] rounded-xl",
          className
        )}
      >
        <Link href={`/kitabghor/books/${book.id}`}>
          <div className="relative aspect-square w-full overflow-hidden bg-white p-3">
            <Image
              src={book.image || "/placeholder.svg"}
              alt={book.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
            />
          </div>
        </Link>

        <CardContent className="p-3">
          <Link href={`/kitabghor/books/${book.id}`}>
            <h4 className="font-semibold text-sm text-[#0D1414] hover:text-[#0E4B4B] transition-colors line-clamp-2">
              {book.name}
            </h4>
          </Link>

          {showAuthor && book.writer && (
            <p className="text-xs text-[#5FA3A3] mt-1 truncate">
              {book.writer.name}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-sm text-[#0E4B4B]">
              ৳{book.price}
            </span>
            {book.discount > 0 && (
              <span className="text-xs font-semibold bg-[#C0704D] text-white px-1.5 py-0.5 rounded-full">
                {book.discount}%
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-3 pt-0">
          {onAddToCart && (
            <Button
              disabled={book.stock === 0}
              onClick={handleAddToCartClick}
              size="sm"
              className="w-full rounded-lg text-white font-semibold text-xs py-5 bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3]"
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              {book.stock === 0 ? "স্টক শেষ" : "কার্টে যোগ করুন"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Default variant layout (original style)
  return (
    <Card
      className={cn(
        "group overflow-hidden border-0 shadow-sm hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-[#F4F8F7] rounded-2xl relative",
        className
      )}
    >
      {/* Badges */}
      {showBadges && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {book.discount > 0 && (
            <div className="bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {book.discount}% ছাড়
            </div>
          )}
          {book.isPreOrder && (
            <div className="bg-gradient-to-r from-[#5FA3A3] to-[#0E4B4B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              📖 প্রি-অর্ডার
            </div>
          )}
          {isBestseller && (
            <div className="bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              বেস্টসেলার
            </div>
          )}
          {isNew && (
            <div className="bg-gradient-to-r from-[#5FA3A3] to-[#0E4B4B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              নতুন
            </div>
          )}
        </div>
      )}

      {/* Wishlist Button */}
      {onWishlistToggle && (
        <button
          onClick={handleWishlistClick}
          className={cn(
            "absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300",
            isWishlisted
              ? "bg-red-500/20 text-red-500"
              : "bg-white/80 text-[#5FA3A3] hover:bg-red-500/20 hover:text-red-500"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              isWishlisted && "scale-110 fill-current"
            )}
          />
        </button>
      )}

      {/* Book Image */}
      <Link href={`/kitabghor/books/${book.id}`}>
        <div className="relative w-full overflow-hidden bg-white p-4">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={book.image || "/placeholder.svg"}
              alt={book.name}
              fill
              className="object-contain transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick View */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <BookOpen className="h-6 w-6 text-[#0E4B4B]" />
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        {/* Rating */}
        {showRating && (
          <div className="flex items-center gap-1 mb-3 min-h-[20px]">
            {reviewCount > 0 ? (
              <>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3 w-3",
                        star <= Math.round(avgRating)
                          ? "fill-[#C0704D] text-[#C0704D]"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#5FA3A3] ml-1">
                  ({avgRating.toFixed(1)} · {reviewCount} রিভিউ)
                </span>
              </>
            ) : (
              <span className="text-xs text-[#5FA3A3]">এখনও কোন রিভিউ নেই</span>
            )}
          </div>
        )}

        {/* Book Title */}
        <Link href={`/kitabghor/books/${book.id}`}>
          <h4 className="font-bold text-lg mb-2 text-[#0D1414] hover:text-[#0E4B4B] line-clamp-2 leading-tight group-hover:translate-x-1 transition-transform">
            {book.name}
          </h4>
        </Link>

        {/* Author */}
        {showAuthor && book.writer && (
          <p className="text-sm text-[#5FA3A3] mb-3 flex items-center">
            <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
            {book.writer.name}
          </p>
        )}

        {/* Pre-order Info */}
        {book.isPreOrder && book.preOrderEndDate && (
          <div className="mb-3 p-2 bg-[#C0704D]/10 rounded-lg">
            <p className="text-xs text-[#C0704D] font-semibold">
              প্রি-অর্ডার শেষ: {new Date(book.preOrderEndDate).toLocaleDateString()}
            </p>
            {book.preOrderDiscount && book.preOrderDiscount > 0 && (
              <p className="text-xs text-green-600 font-semibold">
                স্পেশাল ছাড়: {book.preOrderDiscount}%
              </p>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xl text-[#0E4B4B]">
              ৳{book.price}
            </span>
            {book.discount > 0 && (
              <span className="text-sm text-[#5FA3A3] line-through">
                ৳{book.original_price}
              </span>
            )}
          </div>
          {book.stock === 0 ? (
            <div className="text-xs font-semibold bg-rose-600 text-white px-2 py-1 rounded-full">
              স্টক শেষ
            </div>
          ) : (
            book.discount > 0 && (
              <div className="text-xs font-semibold bg-[#C0704D] text-white px-2 py-1 rounded-full">
                সাশ্রয় করুন
              </div>
            )
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        {onAddToCart && (
          <Button
            disabled={book.stock === 0}
            onClick={handleAddToCartClick}
            className={cn(
              "w-full rounded-xl py-6 text-white font-semibold border-0 shadow-md transition-all duration-300",
              book.stock === 0
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3] hover:shadow-lg hover:scale-105 group/btn"
            )}
          >
            <ShoppingCart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            {book.stock === 0 ? "স্টক শেষ" : "কার্টে যোগ করুন"}
          </Button>
        )}
      </CardFooter>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#0E4B4B]/20 transition-all duration-500 pointer-events-none" />
    </Card>
  );
}