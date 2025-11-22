"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star, Zap, BookOpen } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Category {
  id: string | number;
  name: string;
}

interface Product {
  id: string | number;
  name: string;
  category: { id: string | number };
  price: number;
  original_price: number;
  discount: number;
  writer: { name: string };
  image: string;
  stock?: number;
}

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

export default function CategoryBooks({ category }: { category: Category }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  // 🔹 /api/products থেকে সব প্রোডাক্ট লোড
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) {
          console.error(
            "Failed to fetch products for CategoryBooks:",
            res.statusText
          );
          setAllProducts([]);
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Invalid products response for CategoryBooks:", data);
          setAllProducts([]);
          return;
        }

        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: {
            id: p.category?.id ?? p.categoryId ?? "unknown",
          },
          price: Number(p.price ?? 0),
          original_price: Number(p.original_price ?? p.price ?? 0),
          discount: Number(p.discount ?? 0),
          stock: Number(p.stock ?? 0),
          writer: {
            name: p.writer?.name ?? "অজ্ঞাত লেখক",
          },
          image: p.image ?? "/placeholder.svg",
        }));

        setAllProducts(mapped);
      } catch (err) {
        console.error("Error fetching products for CategoryBooks:", err);
        setAllProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // 🔹 ক্যাটাগরি অনুযায়ি প্রোডাক্ট ফিল্টার
  const categoryBooks =
    category.id === "all"
      ? allProducts
      : allProducts.filter(
          (product: Product) =>
            String(product.category.id) === String(category.id)
        );

  const displayBooks = categoryBooks.slice(0, 8);

  // ⭐ এই ক্যাটাগরির বইগুলোর রিভিউ থেকে রেটিং লোড
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ids = Array.from(
          new Set(
            displayBooks
              .map((b) => Number(b.id))
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

              const data = await res.json();
              return {
                id,
                avg: Number(data.averageRating ?? 0),
                total: Number(data.pagination?.total ?? 0),
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
      } catch (err) {
        console.error("Error loading ratings:", err);
      }
    };

    if (!loadingProducts) {
      fetchRatings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, loadingProducts, allProducts.length]);

  // 🔹 Wishlist toggle (with API) - শুধু wishlist-এ login required
  const toggleWishlist = async (product: Product) => {
    try {
      if (!session?.user) {
        toast.error("উইশলিস্ট ব্যবহার করতে আগে লগইন করুন");
        return;
      }

      const numericId = Number(product.id);
      if (!numericId || Number.isNaN(numericId)) {
        console.error("Invalid product id for wishlist:", product.id);
        toast.error("পণ্যের তথ্য সঠিক নয়");
        return;
      }

      const alreadyInWishlist = isInWishlist(product.id);

      if (alreadyInWishlist) {
        // ✅ Remove from wishlist (DELETE)
        const res = await fetch(`/api/wishlist?productId=${numericId}`, {
          method: "DELETE",
        });

        if (res.status === 401) {
          toast.error("উইশলিস্ট থেকে সরাতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Remove from wishlist failed:", data || res.statusText);
          toast.error("উইশলিস্ট থেকে সরানো যায়নি");
          return;
        }

        removeFromWishlist(product.id);
        toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
      } else {
        // ✅ Add to wishlist (POST)
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: numericId }),
        });

        if (res.status === 401) {
          toast.error("উইশলিস্টে যোগ করতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Add to wishlist failed:", data || res.statusText);
          toast.error("উইশলিস্টে যোগ করা যায়নি");
          return;
        }

        addToWishlist(product.id);
        toast.success("উইশলিস্টে যোগ করা হয়েছে");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("উইশলিস্ট হালনাগাদ করতে সমস্যা হয়েছে");
    }
  };

  // 🔹 Cart-এ add করতে login এর requirement নেই - localStorage/cart context ব্যবহার
  const handleAddToCart = (book: Product) => {
    try {
      addToCart(book.id);
      toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);

      // Optional: logged-in অবস্থায় backend sync
      if (session?.user) {
        fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(book.id),
            quantity: 1,
          }),
        }).catch((error) => {
          console.error("Failed to sync cart with backend:", error);
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("কার্টে যোগ করতে সমস্যা হয়েছে");
    }
  };

  // ⛔ এই ক্যাটাগরিতে যদি কোনো প্রোডাক্ট না থাকে, তাহলে কিছুই দেখাব না
  if (!loadingProducts && categoryBooks.length === 0) {
    return null;
  }

  // চাইলে loading অবস্থায়ও কিছু দেখাতে পারো, না চাইলে null-ই থাক
  if (loadingProducts && category.id !== "all") {
    return null;
  }

  return (
    <div className="mb-16">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
          <div>
            <h3 className="text-3xl font-bold text-[#0D1414]">
              {category.name}
            </h3>
            <p className="text-[#5FA3A3] mt-1">
              {categoryBooks.length}টি বই পাওয়া যাচ্ছে
            </p>
          </div>
        </div>
        {categoryBooks.length > 8 && (
          <Link href={`/kitabghor/categories/${category.id}`}>
            <Button
              variant="outline"
              className="rounded-full border-[#5FA3A3] text-[#5FA3A3] hover:bg-[#5FA3A3] hover:text-white transition-all duration-300 px-6 group"
            >
              সব দেখুন
              <Zap className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
            </Button>
          </Link>
        )}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {displayBooks.map((book: Product, index) => {
          const ratingInfo = ratings[String(book.id)];
          const avgRating = ratingInfo?.averageRating ?? 0;
          const reviewCount = ratingInfo?.totalReviews ?? 0;

          const isBestseller = index % 3 === 0;
          const isNew = index % 4 === 0;
          const isWishlisted = isInWishlist(book.id);

          return (
            <Card
              key={book.id}
              className="group overflow-hidden border-0 shadow-sm hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-[#F4F8F7] rounded-2xl relative"
            >
              {/* Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                {book.discount > 0 && (
                  <div className="bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {book.discount}% ছাড়
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

              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  void toggleWishlist(book);
                }}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isWishlisted
                    ? "bg-red-500/20 text-red-500"
                    : "bg-white/80 text-[#5FA3A3] hover:bg-red-500/20 hover:text-red-500"
                }`}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={`h-5 w-5 transition-all ${
                    isWishlisted
                      ? "scale-110 fill-current"
                      : "group-hover:scale-110"
                  }`}
                />
              </button>

              {/* Book Image */}
              <Link href={`/kitabghor/books/${book.id}`}>
                <div className="relative h-72 w-full overflow-hidden">
                  <Image
                    src={book.image || "/placeholder.svg"}
                    alt={book.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                <div className="flex items-center gap-1 mb-3 min-h-[20px]">
                  {reviewCount > 0 ? (
                    <>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(avgRating)
                                ? "fill-[#C0704D] text-[#C0704D]"
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
                    <span className="text-xs text-[#5FA3A3]">
                      এখনও কোন রিভিউ নেই
                    </span>
                  )}
                </div>

                {/* Book Title */}
                <Link href={`/kitabghor/books/${book.id}`}>
                  <h4 className="font-bold text-lg mb-2 text-[#0D1414] hover:text-[#0E4B4B] duration-300 line-clamp-2 leading-tight group-hover:translate-x-1 transition-transform">
                    {book.name}
                  </h4>
                </Link>

                {/* Author */}
                <p className="text-sm text-[#5FA3A3] mb-3 flex items-center">
                  <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
                  {book.writer.name}
                </p>

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
                      Stock Out
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
                <Button
                  disabled={book.stock === 0}
                  className={`w-full rounded-xl py-6 text-white font-semibold border-0 shadow-md transition-all duration-300
              =${
                book.stock === 0
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3] hover:shadow-lg hover:scale-105 group/btn"
              }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (book.stock !== 0) {
                      handleAddToCart(book);
                    }
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                  {book.stock === 0 ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                </Button>
              </CardFooter>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#0E4B4B]/20 transition-all duration-500 pointer-events-none"></div>
            </Card>
          );
        })}
      </div>

      {/* View All Bottom CTA */}
      {categoryBooks.length > 8 && (
        <div className="text-center mt-10">
          <Link href={`/kitabghor/categories/${category.id}`}>
            <Button
              variant="ghost"
              className="rounded-full bg-[#F4F8F7] hover:bg-[#C0704D] text-[#0D1414] hover:text-white transition-all duration-300 px-8 py-6 group"
            >
              <span className="mr-2">
                {categoryBooks.length - 8}+ আরও বই দেখুন
              </span>
              <Zap className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
