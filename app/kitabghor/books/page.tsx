"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star, BookOpen, Search, Zap } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface Product {
  id: number;
  name: string;
  category: { id: number; name: string };
  price: number;
  original_price: number;
  discount: number;
  writer: { name: string };
  image: string;
}

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

export default function AllBooksPage() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});

  useEffect(() => {
    const fetchProductsAndRatings = async () => {
      try {
        // 1) সব প্রোডাক্ট লোড
        const res = await fetch("/api/products");
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: Product[] = await res.json();
        setProducts(data);

        // 2) প্রতিটা প্রোডাক্টের জন্য রেটিং লোড
        const ids = Array.from(
          new Set(
            data
              .map((p) => Number(p.id))
              .filter((id) => !!id && !Number.isNaN(id))
          )
        );

        if (ids.length === 0) {
          setRatings({});
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(
                `/api/reviews?productId=${id}&page=1&limit=1`
              );

              if (!res.ok) {
                return { id, avg: 0, total: 0 };
              }

              const rdata = await res.json();
              return {
                id,
                avg: Number(rdata.averageRating ?? 0),
                total: Number(rdata.pagination?.total ?? 0),
              };
            } catch (err) {
              console.error("Error fetching rating for product:", id, err);
              return { id, avg: 0, total: 0 };
            }
          })
        );

        const map: Record<string, RatingInfo> = {};
        for (const r of results) {
          map[String(r.id)] = {
            averageRating: r.avg,
            totalReviews: r.total,
          };
        }
        setRatings(map);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProductsAndRatings();
  }, []);

  const handleToggleWishlist = (bookId: number) => {
    if (isInWishlist(bookId)) {
      removeFromWishlist(bookId);
      toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
    } else {
      addToWishlist(bookId);
      toast.success("উইশলিস্টে যোগ করা হয়েছে");
    }
  };

  // ✅ Login থাকুক আর না থাকুক, আগে লোকাল cart context আপডেট হবে
  // ✅ শুধু authenticated হলে API দিয়ে /api/cart এ sync করবে
  const handleAddToCart = async (book: Product) => {
    // ১) লোকাল কার্টে আগে যোগ করি (guest mode এর জন্য সবচেয়ে জরুরি)
    addToCart(book.id);
    toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);

    // ২) যদি ইউজার লগইন করা থাকে, তখন server-side cart এ sync করি
    if (status === "authenticated") {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: book.id,
            quantity: 1,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Server cart sync failed:", data || res.statusText);
          // এখানে চাইলে warning type toast দিতে পারো
          // toast.warning("সার্ভারের কার্ট আপডেট হয়নি, তবে লোকাল কার্টে আছে");
        }
      } catch (err) {
        console.error("Error syncing cart to server:", err);
        // এখানেও warning দিলে হবে, কিন্তু লোকাল cart ঠিক আছে
      }
    }
  };

  const filteredBooks = products.filter((book) =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white">
      <div className="pt-8 md:pt-12 lg:pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-1.5 md:w-2 h-8 md:h-12 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0D1414]">
                সকল বই
              </h1>
            </div>
            <p className="text-[#5FA3A3] text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              আমাদের সম্পূর্ণ বইয়ের সংগ্রহ একত্রিত। আপনার পছন্দের বইটি খুঁজে নিন
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto mb-8 md:mb-12 px-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#5FA3A3]" />
              <Input
                type="text"
                placeholder="বই, লেখক বা বিষয় অনুসন্ধান করুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-[#5FA3A3]/30 focus:border-[#0E4B4B] focus:ring-2 focus:ring-[#0E4B4B]/20 bg-white shadow-lg"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8 px-4">
            <div className="text-[#5FA3A3] text-sm sm:text-base">
              <span className="font-semibold text-[#0E4B4B]">
                {filteredBooks.length}
              </span>
              টি বই পাওয়া গেছে
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="rounded-full border-[#0E4B4B] text-[#0E4B4B] hover:bg-[#0E4B4B] hover:text-white text-sm px-4 py-2"
              >
                অনুসন্ধান সরান
              </Button>
            )}
          </div>

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 md:py-16 lg:py-20">
              <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-[#5FA3A3]/30 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-[#0D1414] mb-2">
                কোন বই পাওয়া যায়নি
              </h3>
              <p className="text-[#5FA3A3] text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                আপনার অনুসন্ধানের সাথে মিলছে এমন কোন বই নেই
              </p>
              <Button
                onClick={() => setSearchTerm("")}
                className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                সব বই দেখুন
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0">
              {filteredBooks.map((book, index) => {
                const ratingInfo = ratings[String(book.id)];
                const avgRating = ratingInfo?.averageRating ?? 0;
                const reviewCount = ratingInfo?.totalReviews ?? 0;

                const isBestseller = index % 3 === 0;
                const isNew = index % 4 === 0;
                const isWishlisted = isInWishlist(book.id);

                return (
                  <Card
                    key={book.id}
                    className="group overflow-hidden border-0 shadow-sm hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-[#F4F8F7] rounded-xl sm:rounded-2xl relative"
                  >
                    {/* Badges */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 flex flex-col gap-1 sm:gap-2">
                      {book.discount > 0 && (
                        <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                          {book.discount}% ছাড়
                        </div>
                      )}
                      {isBestseller && (
                        <div className="bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                          বেস্টসেলার
                        </div>
                      )}
                      {isNew && (
                        <div className="bg-gradient-to-r from-[#5FA3A3] to-[#0E4B4B] text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                          নতুন
                        </div>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => handleToggleWishlist(book.id)}
                      className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                        isWishlisted
                          ? "bg-red-500/20 text-red-500"
                          : "bg-white/80 text-gray-500 hover:bg-red-500/20 hover:text-red-500"
                      }`}
                      aria-label={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      <Heart
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${
                          isWishlisted
                            ? "scale-110 fill-current"
                            : "group-hover:scale-110"
                        }`}
                      />
                    </button>

                    {/* Book Image */}
                    <Link href={`/kitabghor/books/${book.id}`}>
                      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 w-full overflow-hidden">
                        <Image
                          src={book.image || "/placeholder.svg"}
                          alt={book.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 sm:p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-[#0E4B4B]" />
                          </div>
                        </div>
                      </div>
                    </Link>

                    <CardContent className="p-3 sm:p-4 md:p-5">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2 sm:mb-3 min-h-[18px]">
                        {reviewCount > 0 ? (
                          <>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                                    star <= Math.round(avgRating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-[#5FA3A3] ml-1">
                              ({avgRating.toFixed(1)} · {reviewCount} রিভিউ)
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#5FA3A3]/50">
                            এখনও কোন রিভিউ নেই
                          </span>
                        )}
                      </div>

                      {/* Book Title */}
                      <Link href={`/kitabghor/books/${book.id}`}>
                        <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-[#0D1414] hover:text-[#0E4B4B] duration-300 line-clamp-2 leading-tight group-hover:translate-x-1 transition-transform min-h-[2.5rem] sm:min-h-[3rem]">
                          {book.name}
                        </h4>
                      </Link>

                      {/* Author */}
                      <p className="text-xs sm:text-sm text-[#5FA3A3] mb-2 sm:mb-3 flex items-center">
                        <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-1 sm:mr-2"></span>
                        {book.writer.name}
                      </p>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-baseline gap-1 sm:gap-2">
                          <span className="font-bold text-lg sm:text-xl text-[#0E4B4B]">
                            ৳{book.price}
                          </span>
                          {book.discount > 0 && (
                            <span className="text-xs sm:text-sm text-[#5FA3A3]/60 line-through">
                              ৳{book.original_price}
                            </span>
                          )}
                        </div>
                        {book.discount > 0 && (
                          <div className="text-xs font-semibold bg-[#F4F8F7] text-[#0E4B4B] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-[#5FA3A3]/30">
                            সাশ্রয়
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="p-3 sm:p-4 md:p-5 pt-0">
                      <Button
                        className="w-full rounded-lg sm:rounded-xl py-3 sm:py-4 md:py-6 bg-gradient-to-r from-[#187a7a] to-[#5b9b9b] hover:from-[#0E4B4B] hover:to-[#42a8a8] text-white font-semibold border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group/btn text-sm sm:text-base"
                        onClick={() => handleAddToCart(book)}
                      >
                        <ShoppingCart className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover/btn:scale-110 transition-transform" />
                        কার্টে যোগ করুন
                      </Button>
                    </CardFooter>

                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-transparent group-hover:border-[#5FA3A3]/20 transition-all duration-500 pointer-events-none"></div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Load More CTA */}
          {filteredBooks.length > 0 && (
            <div className="text-center mt-12 md:mt-16 px-4">
              <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] p-0.5 rounded-full inline-block">
                <Button
                  variant="ghost"
                  className="rounded-full bg-white hover:bg-[#F4F8F7] text-[#0D1414] font-semibold px-6 sm:px-8 py-4 sm:py-6 group text-sm sm:text-base"
                >
                  <span className="mr-1.5 sm:mr-2">আরও বই লোড করুন</span>
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-180 transition-transform duration-500" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
