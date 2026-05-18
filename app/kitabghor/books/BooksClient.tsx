"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  Suspense,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Star, BookOpen, Search, Zap } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { BookCard } from "@/components/ecommarce/BookCard";

interface Product {
  id: number;
  name: string;
  category?: { id: number; name: string } | null;
  price: number;
  original_price: number;
  discount: number;
  writer?: { name: string } | null;
  publisher?: { name: string } | null;
  image: string;
  stock?: number;
}

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

const AllBooksPage = memo(function AllBooksPage() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Optimized data fetch with caching
  useEffect(() => {
    const fetchProductsAndRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Fetch products with caching
        const res = await fetch("/api/products", {
          cache: "force-cache",
          next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: Product[] = await res.json();
        setProducts(data);

        // 2) Fetch ratings with caching (only for visible products)
        const productIds = data.slice(0, 20).map((p) => p.id); // First 20 products

        const ratingResults = await Promise.all(
          productIds.map(async (id) => {
            try {
              const ratingRes = await fetch(
                `/api/reviews?productId=${id}&page=1&limit=1`,
                { cache: "force-cache" },
              );

              if (!ratingRes.ok) {
                return { id, avg: 0, total: 0 };
              }

              const ratingData = await ratingRes.json();
              return {
                id,
                avg: Number(ratingData.averageRating ?? 0),
                total: Number(ratingData.pagination?.total ?? 0),
              };
            } catch (err) {
              console.error(`Error fetching rating for product ${id}:`, err);
              return { id, avg: 0, total: 0 };
            }
          }),
        );

        const ratingsMap: Record<string, RatingInfo> = {};
        ratingResults.forEach(({ id, avg, total }) => {
          ratingsMap[String(id)] = {
            averageRating: avg,
            totalReviews: total,
          };
        });

        setRatings(ratingsMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("বই লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndRatings();
  }, []);

  // 🔹 Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    const term = searchTerm.toLowerCase();

    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(term);

      const writerMatch = product.writer?.name?.toLowerCase().includes(term);

      const categoryMatch = product.category?.name
        ?.toLowerCase()
        .includes(term);

      const publisherMatch = product.publisher?.name
        ?.toLowerCase()
        .includes(term);

      return nameMatch || writerMatch || categoryMatch || publisherMatch;
    });
  }, [products, searchTerm]);

  // 🔹 Memoized callbacks
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      try {
        if (status !== "authenticated") {
          toast.error("উইশলিস্ট ব্যবহার করতে আগে লগইন করুন");
          return;
        }

        const alreadyInWishlist = isInWishlist(product.id);

        if (alreadyInWishlist) {
          const res = await fetch(`/api/wishlist?productId=${product.id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error("Failed to remove from wishlist");
          }

          removeFromWishlist(product.id);
          toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
        } else {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          });

          if (!res.ok) {
            throw new Error("Failed to add to wishlist");
          }

          addToWishlist(product.id);
          toast.success("উইশলিস্টে যোগ করা হয়েছে");
        }
      } catch (error) {
        console.error("Error toggling wishlist:", error);
        toast.error("উইশলিস্ট হালনাগাদ করতে সমস্যা হয়েছে");
      }
    },
    [status, isInWishlist, addToWishlist, removeFromWishlist],
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      try {
        addToCart(product.id);
        toast.success(`"${product.name}" কার্টে যোগ করা হয়েছে`);
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("কার্টে যোগ করতে সমস্যা হয়েছে");
      }
    },
    [addToCart],
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
              আমাদের সম্পূর্ণ বইয়ের সংগ্রহ একত্রিত। আপনার পছন্দের বইটি খুঁজে
              নিন
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
                onChange={handleSearchChange}
                className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-[#5FA3A3]/30 focus:border-[#0E4B4B] focus:ring-2 focus:ring-[#0E4B4B]/20 bg-white shadow-lg"
              />
            </div>
          </div>

          {/* Loading / Error */}
          {loading ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA3A3]"></div>
                <p className="text-[#5FA3A3]">বই লোড হচ্ছে...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#0E4B4B] text-white rounded-lg hover:bg-[#5FA3A3] transition-colors"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8 px-4">
                <div className="text-[#5FA3A3] text-sm sm:text-base">
                  <span className="font-semibold text-[#0E4B4B] mr-1">
                    {filteredProducts.length}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((book, index) => {
                  const ratingInfo = ratings[String(book.id)];

                  return (
                    <BookCard
                      key={book.id}
                      book={{
                        id: book.id,
                        name: book.name,
                        price: book.price,
                        original_price: book.original_price,
                        discount: book.discount,
                        writer: book.writer
                          ? {
                              id: index,
                              name: book.writer.name,
                            }
                          : null,
                        publisher: book.publisher
                          ? {
                              id: index,
                              name: book.publisher.name,
                            }
                          : null,
                        image: book.image,
                        stock: book.stock,
                      }}
                      ratingInfo={{
                        averageRating: ratingInfo?.averageRating ?? 0,
                        totalReviews: ratingInfo?.totalReviews ?? 0,
                      }}
                      isWishlisted={isInWishlist(book.id)}
                      onWishlistToggle={() => toggleWishlist(book)}
                      onAddToCart={() => handleAddToCart(book)}
                      variant="default"
                    />
                  );
                })}
              </div>

              {/* Load More CTA */}
              {filteredProducts.length > 0 && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
});

AllBooksPage.displayName = "AllBooksPage";

export default function BooksPageClient() {
  return (
    <Suspense fallback={<BooksSkeleton />}>
      <AllBooksPage />
    </Suspense>
  );
}

// Skeleton component for loading state
function BooksSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-6" />
          <Skeleton className="h-12 w-full max-w-md mx-auto" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden bg-white rounded-2xl shadow-lg"
            >
              <div className="relative h-64 overflow-hidden">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
